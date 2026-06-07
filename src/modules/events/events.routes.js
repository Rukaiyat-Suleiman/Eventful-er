const { Router } = require("express");
const sendResponse = require("../../middlewares/response.middleware.js");
const { verifyToken, optionalToken } = require("../../middlewares/auth.middleware.js");
const eventsController = require("./events.controller.js");
const router = Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Healthcheck endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Success message
 */
router.get ("/", (req, res) => {
    sendResponse(res, 200, true, "Hi",)
})

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventName
 *               - eventDate
 *             properties:
 *               eventName:
 *                 type: string
 *               eventDesc:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date
 *                 description: Event date in ISO format (YYYY-MM-DD)
 *               eventTime:
 *                 type: string
 *                 pattern: '^([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$'
 *                 description: Event time in HH:MM or HH:MM:SS format
 *               isListed:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: No token provided or invalid token
 *       500:
 *         description: Internal server error
 */
router.post("/events", verifyToken, eventsController.createEvent);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Retrieve all listed events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of listed events retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/events", eventsController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Retrieve a specific event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found (or access restricted for unlisted events)
 *       500:
 *         description: Internal server error
 */
router.get("/events/:id", optionalToken, eventsController.getEventById);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an existing event (JSON API)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventName:
 *                 type: string
 *               eventDesc:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date
 *               eventTime:
 *                 type: string
 *                 pattern: '^([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$'
 *               isListed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: No token provided
 *       403:
 *         description: Forbidden (not the event owner)
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
router.put("/events/:id", verifyToken, eventsController.updateEvent);

/**
 * @swagger
 * /api/events/{id}/edit:
 *   post:
 *     summary: Update an existing event (HTML Form)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               eventName:
 *                 type: string
 *               eventDesc:
 *                 type: string
 *               eventDate:
 *                 type: string
 *                 format: date
 *               eventTime:
 *                 type: string
 *                 pattern: '^([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$'
 *               isListed:
 *                 type: string
 *                 enum: [on]
 *     responses:
 *       302:
 *         description: Redirects back to /events/{id} on success
 *       400:
 *         description: Validation error
 *       401:
 *         description: No token provided
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
router.post("/events/:id/edit", verifyToken, eventsController.updateEvent);

/**
 * @swagger
 * /api/events/{id}/verify:
 *   get:
 *     summary: Verify an event ticket QR code
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *       - in: query
 *         name: ticket
 *         required: true
 *         schema:
 *           type: integer
 *         description: The QR code (ticket) ID
 *     responses:
 *       200:
 *         description: Ticket is valid
 *       403:
 *         description: Unauthorized (not the event host)
 *       404:
 *         description: Event or ticket not found
 *       500:
 *         description: Internal server error
 */
router.get("/events/:id/verify", verifyToken, eventsController.verifyTicket);

module.exports = router;
