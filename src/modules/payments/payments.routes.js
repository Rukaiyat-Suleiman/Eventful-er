const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Initialize Payment - requires authentication
router.post('/initialize/:eventId', verifyToken, paymentsController.initializePayment);

// Webhook endpoint - no auth required, Paystack calls this directly
router.post('/webhook', paymentsController.paystackWebhook);

module.exports = router;
