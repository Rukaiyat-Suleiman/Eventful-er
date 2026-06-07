'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Event.init({
    userId: DataTypes.INTEGER,
    eventName: DataTypes.STRING,
    eventDesc: DataTypes.TEXT,
    totalRespondent: DataTypes.INTEGER,
    eventDate: DataTypes.DATEONLY,
    eventTime: DataTypes.TIME,
    totalAttended: DataTypes.INTEGER,
    isPublic: DataTypes.BOOLEAN,
    price: DataTypes.DECIMAL(10, 2),
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    region: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Event',
  });
  return Event;
};