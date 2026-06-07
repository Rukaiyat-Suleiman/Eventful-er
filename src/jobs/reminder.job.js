const cron = require('node-cron');
const { Event, Payment, User } = require('../database/models');
const { logger } = require('../config/logger.config');

const startReminderJob = () => {
  // Run at the top of every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running event reminder cron job...');
    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Fetch upcoming events that have not had a reminder sent
      const events = await Event.findAll({
        where: {
          reminderSentAt: null
        }
      });

      for (const event of events) {
        if (!event.eventDate) continue;
        
        let eventDateTime;
        if (event.eventTime) {
          eventDateTime = new Date(`${event.eventDate}T${event.eventTime}`);
        } else {
          eventDateTime = new Date(event.eventDate);
        }

        // If the event starts within the next 24 hours and is in the future
        if (eventDateTime > now && eventDateTime <= next24Hours) {
          logger.info(`Sending reminders for event: ${event.eventName} (ID: ${event.id})`);

          // Fetch attendees (successful payments)
          const payments = await Payment.findAll({
            where: { eventId: event.id, status: 'success' },
            include: [{ model: User, as: 'user' }]
          });

          for (const payment of payments) {
             const user = payment.user;
             if (user && user.email) {
               // [NOTE] Email sending is mocked here due to lack of a verified domain for SMTP providers like Mailtrap
               logger.info(`[EMAIL MOCK] To: ${user.email} | Subject: Reminder: ${event.eventName} starts in 24 hours!`);
             }
          }

          // Mark reminder as sent
          event.reminderSentAt = new Date();
          await event.save();
        }
      }
    } catch (error) {
      logger.error('Error in event reminder cron job: ' + error.message);
    }
  });
};

module.exports = { startReminderJob };
