'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Events', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Events', 'currency', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'NGN'
    });
    await queryInterface.addColumn('Events', 'region', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Events', 'price');
    await queryInterface.removeColumn('Events', 'currency');
    await queryInterface.removeColumn('Events', 'region');
  }
};
