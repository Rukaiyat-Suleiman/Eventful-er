const { Router } = require("express");
const { verifyToken, optionalToken } = require("../../middlewares/auth.middleware.js");
const { Event, Payment, QrCode } = require("../../database/models");
const QRCode = require('qrcode');

const router = Router();

router.get("/", optionalToken, (req, res) => {
    res.render("index", { user: req.user || null });
});

router.get("/login", (req, res) => {
    if (req.cookies && req.cookies.jwt) {
        return res.redirect("/dashboard");
    }
    res.render("login");
});

router.get("/signup", (req, res) => {
    if (req.cookies && req.cookies.jwt) {
        return res.redirect("/dashboard");
    }
    res.render("signup");
});

// Protected route
router.get("/dashboard", verifyToken, async (req, res, next) => {
    try {
        let events = [];
        let tickets = [];
        let analytics = {
            totalEvents: 0,
            totalTicketsSold: 0,
            totalCheckins: 0,
            totalRevenue: 0
        };
        if (req.user.role === 'host') {
            events = await Event.findAll({ where: { userId: req.user.id } });
            analytics.totalEvents = events.length;
            events.forEach(e => {
                analytics.totalTicketsSold += e.totalRespondent || 0;
                analytics.totalCheckins += e.totalAttended || 0;
                analytics.totalRevenue += (e.totalRespondent || 0) * (e.price || 0);
            });
        } else if (req.user.role === 'attendee') {
            const payments = await Payment.findAll({ where: { userId: req.user.id, paymentState: 'success' } });
            const eventIds = payments.map(p => p.eventId);
            tickets = await Event.findAll({ where: { id: eventIds } });
        }
        res.render("dashboard", { user: req.user, events, tickets, analytics });
    } catch (err) {
        next(err);
    }
});

// Profile page
router.get("/profile", verifyToken, async (req, res, next) => {
    try {
        const user = await req.user;
        const fullUser = await require("../../database/models").User.findByPk(user.id);
        if (!fullUser) {
            return res.redirect("/login");
        }
        res.render("profile", { user: fullUser });
    } catch (err) {
        next(err);
    }
});

router.get("/events", optionalToken, async (req, res) => {
    try {
        const events = await Event.findAll({ where: { isListed: true } });
        res.render("events", { user: req.user || null, events });
    } catch (err) {
        res.status(500).send("Error loading events: " + err.message);
    }
});

router.get("/events/:id", optionalToken, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).send("Event not found");
        }
        if (!event.isListed) {
            if (!req.user) {
                return res.status(404).send("Event not found");
            }
            if (req.user.role !== "attendee" && req.user.id !== event.userId) {
                return res.status(404).send("Event not found");
            }
        }
        let payment = null;
        let qrCode = null;
        let qrCodeDataUri = null;
        if (req.user) {
            payment = await Payment.findOne({ where: { userId: req.user.id, eventId: event.id } });
            if (payment && payment.paymentState === 'success') {
                qrCode = await QrCode.findOne({ where: { userId: req.user.id, eventId: event.id } });
                if (qrCode) {
                    qrCodeDataUri = await QRCode.toDataURL(`http://${req.get('host')}/api/events/${event.id}/verify?ticket=${qrCode.id}`);
                }
            }
        }
        
        res.render("event-detail", { user: req.user || null, event, payment, qrCode, qrCodeDataUri });
    } catch (err) {
        res.status(500).send("Error loading event: " + err.message);
    }
});

module.exports = router;
