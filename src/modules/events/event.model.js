'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      Event.belongsTo(models.User, { foreignKey: 'userId', as: 'organizer' });
      Event.hasMany(models.QrCode, { foreignKey: 'eventId' });
      Event.hasMany(models.Payment, { foreignKey: 'eventId' });
    }
  }
  Event.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    eventName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    eventDesc: {
      type: DataTypes.TEXT
    },
    totalRespondent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    eventDate: {
      type: DataTypes.DATEONLY
    },
    eventTime: {
      type: DataTypes.TIME
    },
    totalAttended: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isListed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2)
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    region: {
      type: DataTypes.STRING
    },
    reminderSentAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Event',
    tableName: 'Events',
    timestamps: true,
    paranoid: true
  });
  return Event;
};
