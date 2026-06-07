const request = require("supertest");
const app = require("../src/app.js");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Event, Payment, QrCode, sequelize } = require("../src/database/models");

describe("Payments API", () => {
    let tokenHost;
    let tokenAttendee;
    let testEventWithPrice;
    let testEventFree;

    beforeAll(async () => {
        const jwtSecret = process.env.JWT_SECRET || "fallback_secret";
        
        tokenHost = jwt.sign({ id: 1, email: "john@example.com", role: "host" }, jwtSecret, { expiresIn: "15m" });
        tokenAttendee = jwt.sign({ id: 2, email: "jane@example.com", role: "attendee" }, jwtSecret, { expiresIn: "15m" });

        testEventWithPrice = await Event.create({
            userId: 1,
            eventName: "Paid Event",
            eventDate: "2026-10-01",
            isListed: true,
            price: "5000.00",
            currency: 'NGN'
        });

        testEventFree = await Event.create({
            userId: 1,
            eventName: "Free Event",
            eventDate: "2026-10-02",
            isListed: true,
            price: null
        });

        // Mock global fetch for Paystack
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    status: true,
                    message: "Authorization URL created",
                    data: {
                        authorization_url: "https://checkout.paystack.com/xxxxxx",
                        access_code: "xxxxxx",
                        reference: "test_ref_123"
                    }
                })
            })
        );
    });

    afterAll(async () => {
        await QrCode.destroy({ where: {}, force: true });
        await Payment.destroy({ where: {}, force: true });
        await Event.destroy({ where: { id: [testEventWithPrice.id, testEventFree.id] }, force: true });
        await sequelize.close();
    });

    describe("POST /api/payments/initialize/:eventId", () => {
        it("should return 401 if unauthenticated", async () => {
            const res = await request(app).post(`/api/payments/initialize/${testEventWithPrice.id}`);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is not an attendee", async () => {
            const res = await request(app)
                .post(`/api/payments/initialize/${testEventWithPrice.id}`)
                .set("Cookie", [`jwt=${tokenHost}`]);
            expect(res.status).toBe(403);
        });

        it("should return 400 if event has no price", async () => {
            const res = await request(app)
                .post(`/api/payments/initialize/${testEventFree.id}`)
                .set("Cookie", [`jwt=${tokenAttendee}`]);
            expect(res.status).toBe(400);
        });

        it("should initialize payment and redirect if valid", async () => {
            const res = await request(app)
                .post(`/api/payments/initialize/${testEventWithPrice.id}`)
                .set("Cookie", [`jwt=${tokenAttendee}`]);
            
            if (res.status !== 302) {
                console.error("Initialize Payment Failed:", res.body);
            }
            expect(res.status).toBe(302);
            expect(res.header.location).toBe("https://checkout.paystack.com/xxxxxx");

            const pendingPayment = await Payment.findOne({ where: { eventId: testEventWithPrice.id, userId: 2 } });
            expect(pendingPayment).not.toBeNull();
            expect(pendingPayment.paymentState).toBe("pending");
            expect(pendingPayment.referenceId).toBe("test_ref_123");
        });
    });

    describe("POST /api/payments/webhook", () => {
        beforeAll(async () => {
            await Payment.create({
                userId: 2,
                eventId: testEventWithPrice.id,
                paymentState: 'pending',
                referenceId: 'webhook_test_ref',
                paymentAmount: 5000
            });
        });
        it("should reject invalid signatures", async () => {
            const res = await request(app)
                .post("/api/payments/webhook")
                .set("x-paystack-signature", "invalid_signature")
                .send({ event: "charge.success" });
            
            expect(res.status).toBe(400);
        });

        it("should process charge.success and create QrCode", async () => {
            const payloadString = JSON.stringify({
                event: "charge.success",
                data: {
                    reference: "webhook_test_ref",
                    channel: "card",
                    gateway_response: "Successful",
                    fees: 10000,
                    metadata: {
                        eventId: testEventWithPrice.id,
                        userId: 2
                    }
                }
            });

            const secret = process.env.PAYSTACK_SK || "";
            const hash = crypto.createHmac('sha512', secret).update(payloadString).digest('hex');

            const res = await request(app)
                .post("/api/payments/webhook")
                .set("x-paystack-signature", hash)
                .set("Content-Type", "application/json")
                .send(payloadString);
            
            expect(res.status).toBe(200);

            const updatedPayment = await Payment.findOne({ where: { referenceId: "webhook_test_ref" } });
            expect(updatedPayment.paymentState).toBe("success");

            const qrCode = await QrCode.findOne({ where: { paymentId: updatedPayment.id } });
            expect(qrCode).not.toBeNull();
            expect(qrCode.eventId).toBe(testEventWithPrice.id);
            expect(qrCode.userId).toBe(2);
        });
    });
});
