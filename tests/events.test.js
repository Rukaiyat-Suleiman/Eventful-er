const request = require("supertest");
const app = require("../src/app.js");
const jwt = require("jsonwebtoken");
const { Event, sequelize } = require("../src/database/models");

describe("Events API", () => {
    let tokenCreator;
    let tokenEventee;
    let tokenOther;
    let testEventListed;
    let testEventUnlisted;

    beforeAll(async () => {
        // Generate mock tokens
        const jwtSecret = process.env.JWT_SECRET || "fallback_secret";
        
        tokenCreator = jwt.sign({ id: 1, email: "john@example.com", role: "host" }, jwtSecret, { expiresIn: "15m" });
        tokenEventee = jwt.sign({ id: 2, email: "jane@example.com", role: "attendee" }, jwtSecret, { expiresIn: "15m" });
        tokenOther = jwt.sign({ id: 3, email: "other@example.com", role: "other_role" }, jwtSecret, { expiresIn: "15m" });

        // Create a listed event owned by user 1
        testEventListed = await Event.create({
            userId: 1,
            eventName: "Listed Test Event",
            eventDate: "2026-09-01",
            isListed: true
        });

        // Create an unlisted event owned by user 1
        testEventUnlisted = await Event.create({
            userId: 1,
            eventName: "Unlisted Test Event",
            eventDate: "2026-09-02",
            isListed: false
        });
    });

    afterAll(async () => {
        // Cleanup test events
        await Event.destroy({ where: { id: [testEventListed.id, testEventUnlisted.id] }, force: true });
        // Close database connection
        await sequelize.close();
    });

    describe("POST /api/events", () => {
        it("should return 401 if no token is provided", async () => {
            const res = await request(app)
                .post("/api/events")
                .send({
                    eventName: "Test Event",
                    eventDate: "2026-07-07"
                })
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("No token provided");
        });

        it("should return 400 if eventName is missing", async () => {
            const res = await request(app)
                .post("/api/events")
                .set("Authorization", `Bearer ${tokenCreator}`)
                .send({
                    eventDate: "2026-07-07"
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Validation error");
        });

        it("should return 400 if eventDate is missing (mandatory)", async () => {
            const res = await request(app)
                .post("/api/events")
                .set("Authorization", `Bearer ${tokenCreator}`)
                .send({
                    eventName: "Test Event"
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Validation error");
            expect(res.body.data).toContain('"eventDate" is required');
        });

        it("should successfully create an event with valid input", async () => {
            const res = await request(app)
                .post("/api/events")
                .set("Authorization", `Bearer ${tokenCreator}`)
                .send({
                    eventName: "Annual Conference",
                    eventDesc: "A great annual conference",
                    eventDate: "2026-08-15",
                    eventTime: "09:00:00",
                    isListed: true
                })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Event created successfully");
            expect(res.body.data.event).toBeDefined();
            expect(res.body.data.event.eventName).toBe("Annual Conference");
            expect(res.body.data.event.eventDate).toBe("2026-08-15");
            expect(res.body.data.event.eventTime).toBe("09:00:00");
            expect(res.body.data.event.isListed).toBe(true);

            // Clean up created event from the database
            await Event.destroy({ where: { id: res.body.data.event.id }, force: true });
        });
    });

    describe("GET /api/events", () => {
        it("should return all listed events", async () => {
            const res = await request(app)
                .get("/api/events")
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.events).toBeDefined();
            expect(Array.isArray(res.body.data.events)).toBe(true);
            
            // Check that the listed event is in the list
            const foundListed = res.body.data.events.find(e => e.id === testEventListed.id);
            expect(foundListed).toBeDefined();

            // Check that the unlisted event is NOT in the list
            const foundUnlisted = res.body.data.events.find(e => e.id === testEventUnlisted.id);
            expect(foundUnlisted).toBeUndefined();
        });
    });

    describe("GET /api/events/:id", () => {
        it("should return 200 for a listed event even if unauthenticated", async () => {
            const res = await request(app)
                .get(`/api/events/${testEventListed.id}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.event.id).toBe(testEventListed.id);
        });

        it("should return 404 for an unlisted event if unauthenticated", async () => {
            const res = await request(app)
                .get(`/api/events/${testEventUnlisted.id}`)
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Event not found");
        });

        it("should return 404 for an unlisted event if authenticated but role is not eventee and not the owner", async () => {
            const res = await request(app)
                .get(`/api/events/${testEventUnlisted.id}`)
                .set("Authorization", `Bearer ${tokenOther}`)
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Event not found");
        });

        it("should return 200 for an unlisted event if authenticated as the event owner/creator", async () => {
            const res = await request(app)
                .get(`/api/events/${testEventUnlisted.id}`)
                .set("Authorization", `Bearer ${tokenCreator}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.event.id).toBe(testEventUnlisted.id);
        });

        it("should return 200 for an unlisted event if authenticated and role is attendee", async () => {
            const res = await request(app)
                .get(`/api/events/${testEventUnlisted.id}`)
                .set("Authorization", `Bearer ${tokenEventee}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.event.id).toBe(testEventUnlisted.id);
        });
    });

    describe("PUT /api/events/:id", () => {
        it("should return 401 if unauthenticated", async () => {
            await request(app)
                .put(`/api/events/${testEventListed.id}`)
                .send({ eventName: "New Name" })
                .expect(401);
        });

        it("should return 403 if not the event owner", async () => {
            await request(app)
                .put(`/api/events/${testEventListed.id}`)
                .set("Authorization", `Bearer ${tokenEventee}`)
                .send({ eventName: "New Name" })
                .expect(403);
        });

        it("should return 200 and update the event if owner", async () => {
            const res = await request(app)
                .put(`/api/events/${testEventListed.id}`)
                .set("Authorization", `Bearer ${tokenCreator}`)
                .send({ eventName: "Updated Event Name" })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.event.eventName).toBe("Updated Event Name");
        });
    });

    describe("POST /api/events/:id/edit", () => {
        it("should redirect on successful HTML form edit", async () => {
            await request(app)
                .post(`/api/events/${testEventListed.id}/edit`)
                .set("Authorization", `Bearer ${tokenCreator}`)
                .set("Content-Type", "application/x-www-form-urlencoded")
                .set("Accept", "text/html")
                .send("eventName=Form+Updated+Name&eventDate=2026-09-01&isListed=on")
                .expect(302)
                .expect("Location", `/events/${testEventListed.id}`);
        });
    });
});
