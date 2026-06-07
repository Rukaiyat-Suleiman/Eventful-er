const Joi = require("joi");
const { Event, QrCode } = require("../../database/models");
const sendResponse = require("../../middlewares/response.middleware");
const { logger } = require("../../config/logger.config");

const createEventSchema = Joi.object({
    eventName: Joi.string().required(),
    eventDesc: Joi.string().allow('', null),
    eventDate: Joi.date().iso().required(),
    eventTime: Joi.string().regex(/^([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/).allow('', null),
    isListed: Joi.boolean().default(true),
    price: Joi.number().min(0).allow(null, ''),
    currency: Joi.string().valid('NGN', 'USD').allow('', null).default('NGN'),
    region: Joi.string().allow('', null)
});

const updateEventSchema = Joi.object({
    eventName: Joi.string().optional(),
    eventDesc: Joi.string().allow('', null).optional(),
    eventDate: Joi.date().iso().optional(),
    eventTime: Joi.string().regex(/^([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/).allow('', null).optional(),
    isListed: Joi.boolean().optional(),
    price: Joi.number().min(0).allow(null, '').optional(),
    currency: Joi.string().valid('NGN', 'USD').allow('', null).optional(),
    region: Joi.string().allow('', null).optional()
});

const createEvent = async (req, res) => {
    // Preprocess isListed checkbox input
    if (req.body.isListed === 'on') {
        req.body.isListed = true;
    } else if (req.body.isListed === undefined && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        req.body.isListed = false;
    }

    const transaction = await Event.sequelize.transaction();
    try {
        const { error, value } = createEventSchema.validate(req.body);
        if (error) {
            await transaction.rollback();
            return sendResponse(res, 400, false, "Validation error", null, error.details[0].message);
        }

        const { eventName, eventDesc, eventDate, eventTime, isListed, price, currency, region } = value;

        const newEvent = await Event.create({
            userId: req.user.id,
            eventName,
            eventDesc: eventDesc || null,
            eventDate,
            eventTime: eventTime || null,
            isListed,
            price: price ? parseFloat(price) : null,
            currency: currency || 'NGN',
            region: region || null
        }, { transaction });

        await transaction.commit();

        if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            return res.redirect('/dashboard');
        }

        return sendResponse(res, 201, true, "Event created successfully", {
            event: {
                id: newEvent.id,
                eventName: newEvent.eventName,
                eventDate: newEvent.eventDate,
                eventTime: newEvent.eventTime,
                isListed: newEvent.isListed,
                price: newEvent.price,
                currency: newEvent.currency,
                region: newEvent.region
            }
        });
    } catch (err) {
        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            // Already rolled back or failed to roll back
        }
        logger.error("Create Event Error:", err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findByPk(id);

        if (!event) {
            return sendResponse(res, 404, false, "Event not found");
        }

        if (!event.isListed) {
            // Unlisted event visibility checks
            if (!req.user) {
                return sendResponse(res, 404, false, "Event not found");
            }
            if (req.user.role !== "attendee" && req.user.id !== event.userId) {
                return sendResponse(res, 404, false, "Event not found");
            }
        }

        return sendResponse(res, 200, true, "Event retrieved successfully", { event });
    } catch (err) {
        logger.error("Get Event By Id Error:", err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll({
            where: { isListed: true }
        });
        return sendResponse(res, 200, true, "Events retrieved successfully", { events });
    } catch (err) {
        logger.error("Get All Events Error:", err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

const updateEvent = async (req, res) => {
    const { id } = req.params;

    // Preprocess isListed checkbox input
    if (req.body.isListed === 'on') {
        req.body.isListed = true;
    } else if (req.body.isListed === undefined && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        req.body.isListed = false;
    }

    const transaction = await Event.sequelize.transaction();
    try {
        const event = await Event.findByPk(id, { transaction });
        if (!event) {
            await transaction.rollback();
            if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                return res.status(404).render("error", { message: "Event not found" });
            }
            return sendResponse(res, 404, false, "Event not found");
        }

        if (event.userId !== req.user.id) {
            await transaction.rollback();
            if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                return res.status(403).render("error", { message: "You are not authorized to edit this event" });
            }
            return sendResponse(res, 403, false, "Forbidden");
        }

        const { error, value } = updateEventSchema.validate(req.body);
        if (error) {
            await transaction.rollback();
            return sendResponse(res, 400, false, "Validation error", null, error.details[0].message);
        }

        if (value.price === '') value.price = null;
        if (value.price) value.price = parseFloat(value.price);
        
        await event.update(value, { transaction });
        await transaction.commit();

        if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            return res.redirect(`/events/${id}`);
        }

        return sendResponse(res, 200, true, "Event updated successfully", { event });
    } catch (err) {
        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            // Ignore
        }
        logger.error("Update Event Error:", err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

const verifyTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticketId = req.query.ticket;
        const user = req.user;

        const event = await Event.findByPk(id);
        if (!event) {
            return sendResponse(res, 404, false, "Event not found");
        }
        
        if (event.userId !== user.id) {
            return sendResponse(res, 403, false, "Unauthorized: Only the event host can scan tickets");
        }

        const qrCode = await QrCode.findOne({ where: { id: ticketId, eventId: id } });
        if (!qrCode) {
            return sendResponse(res, 404, false, "Invalid ticket");
        }

        // Return ticket validity (we can add scanned marking later as requested)
        return sendResponse(res, 200, true, "Ticket is valid", { ticket: qrCode });
    } catch (err) {
        logger.error("Verify Ticket Error:", err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

module.exports = {
    createEvent,
    getEventById,
    getAllEvents,
    updateEvent,
    verifyTicket
};
