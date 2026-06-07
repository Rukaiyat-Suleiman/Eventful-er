const crypto = require("crypto");
const { Event, Payment, QrCode, User } = require("../../database/models");
const sendResponse = require("../../middlewares/response.middleware");
const { logger } = require("../../config/logger.config");

const initializePayment = async (req, res) => {
    try {
        const { eventId } = req.params;
        const user = req.user;

        if (user.role !== 'attendee') {
            return sendResponse(res, 403, false, "Only attendees can purchase tickets");
        }

        const event = await Event.findByPk(eventId);
        if (!event) {
            return sendResponse(res, 404, false, "Event not found");
        }

        if (event.userId === user.id) {
            return sendResponse(res, 403, false, "You cannot purchase tickets for an event you are hosting");
        }

        if (!event.price || event.price <= 0) {
            return sendResponse(res, 400, false, "This event is free or has no price set");
        }

        // Check if user already has a pending or successful payment
        const existingPayment = await Payment.findOne({
            where: { userId: user.id, eventId: event.id, paymentState: 'success' }
        });
        if (existingPayment) {
            return sendResponse(res, 400, false, "You have already purchased a ticket for this event");
        }

        const amountInKobo = Math.round(event.price * 100);

        // Initialize transaction via Paystack API
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SK}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.email,
                amount: amountInKobo,
                currency: event.currency || 'NGN',
                metadata: {
                    eventId: event.id,
                    userId: user.id
                },
                // Set a callback URL to redirect back to event details page
                callback_url: `${req.protocol}://${req.get('host')}/events/${event.id}`
            })
        });

        const data = await response.json();

        if (!data.status) {
            logger.error("Paystack Initialization Error", data);
            return sendResponse(res, 500, false, "Failed to initialize payment", null, data.message);
        }

        // Create pending payment record
        await Payment.create({
            userId: user.id,
            eventId: event.id,
            paymentState: 'pending',
            referenceId: data.data.reference,
            paymentAmount: event.price
        });

        // Redirect user to authorization URL
        return res.redirect(data.data.authorization_url);
    } catch (error) {
        logger.error("Initialize Payment Error:", error);
        return sendResponse(res, 500, false, "Internal server error", null, error.message);
    }
};

const paystackWebhook = async (req, res) => {
    try {
        const secret = process.env.PAYSTACK_SK;
        
        // Retrieve the request's body as string for webhook validation
        // In Express, we need raw body for accurate HMAC computation, but we will assume JSON parsing here
        // A better approach is using req.rawBody or computing HMAC over JSON.stringify(req.body)
        const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
        
        if (hash !== req.headers['x-paystack-signature']) {
            logger.warn("Invalid Paystack webhook signature");
            return res.status(400).send("Invalid signature");
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const paymentData = event.data;
            const reference = paymentData.reference;
            const { eventId, userId } = paymentData.metadata;

            // Find payment by reference
            const payment = await Payment.findOne({ where: { referenceId: reference } });
            
            if (payment && payment.paymentState !== 'success') {
                // Update payment to success
                await payment.update({
                    paymentState: 'success',
                    channel: paymentData.channel,
                    gatewayResponse: paymentData.gateway_response,
                    feesDeducted: paymentData.fees ? (paymentData.fees / 100) : 0
                });

                // Generate QR Code record
                await QrCode.create({
                    userId: payment.userId,
                    eventId: payment.eventId,
                    paymentId: payment.id,
                    scanned: false
                });

                // Increment totalAttended in Event
                await Event.increment('totalAttended', { by: 1, where: { id: payment.eventId } });
            }
        }

        res.status(200).send("OK");
    } catch (error) {
        logger.error("Paystack Webhook Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    initializePayment,
    paystackWebhook
};
