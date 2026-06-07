'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QrCode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  QrCode.init({
    userId: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER,
    scanned: DataTypes.BOOLEAN,
    scannedAt: DataTypes.DATE,
    paymentId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'QrCode',
  });
  return QrCode;
};