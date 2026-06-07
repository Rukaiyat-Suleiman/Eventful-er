'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.User, { foreignKey: 'userId' });
      Payment.belongsTo(models.Event, { foreignKey: 'eventId' });
      Payment.hasMany(models.QrCode, { foreignKey: 'paymentId' });
    }
  }
  Payment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paymentState: {
      type: DataTypes.STRING
    },
    channel: {
      type: DataTypes.STRING
    },
    gatewayResponse: {
      type: DataTypes.STRING
    },
    referenceId: {
      type: DataTypes.STRING
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(10, 2)
    },
    feesDeducted: {
      type: DataTypes.DECIMAL(10, 2)
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'Payments',
    timestamps: true,
    paranoid: true
  });
  return Payment;
};
