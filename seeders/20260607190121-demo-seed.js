'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Seed Users
    await queryInterface.bulkInsert('Users', [
      {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'host',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'attendee',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Seed Events
    await queryInterface.bulkInsert('Events', [
      {
        userId: 1, // John Doe is organizer
        eventName: 'Annual Tech Conference',
        eventDesc: 'A gathering of tech enthusiasts to discuss the future.',
        eventDate: '2026-10-15',
        eventTime: '09:00:00',
        isListed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
    // Seed Payments
    await queryInterface.bulkInsert('Payments', [
      {
        userId: 2, // Jane Smith is the eventee
        eventId: 1, // To the Tech Conference
        paymentState: 'success',
        channel: 'card',
        gatewayResponse: 'Approved',
        referenceId: 'demo-tx-123456',
        paymentAmount: 50.00,
        feesDeducted: 2.50,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Seed QrCodes
    await queryInterface.bulkInsert('QrCodes', [
      {
        userId: 2,
        eventId: 1,
        paymentId: 1,
        scanned: false,
        scannedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('QrCodes', null, {});
    await queryInterface.bulkDelete('Payments', null, {});
    await queryInterface.bulkDelete('Events', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
