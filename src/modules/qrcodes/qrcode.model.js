'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class QrCode extends Model {
    static associate(models) {
      QrCode.belongsTo(models.User, { foreignKey: 'userId', as: 'attendee' });
      QrCode.belongsTo(models.Event, { foreignKey: 'eventId' });
      QrCode.belongsTo(models.Payment, { foreignKey: 'paymentId' });
    }
  }
  QrCode.init({
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
    scanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    scannedAt: {
      type: DataTypes.DATE
    },
    paymentId: {
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'QrCode',
    tableName: 'QrCodes',
    timestamps: true
  });
  return QrCode;
};
