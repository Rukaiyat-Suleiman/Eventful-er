'use strict';

const Sequelize = require('sequelize');
const { sequelize } = require('../../config/sequelize.config.js');
const db = {};

// Register models from feature modules
const registerUser = require('../../modules/users/user.model.js');
const registerEvent = require('../../modules/events/event.model.js');
const registerPayment = require('../../modules/payments/payment.model.js');
const registerQrCode = require('../../modules/qrcodes/qrcode.model.js');

const models = [
  registerUser,
  registerEvent,
  registerPayment,
  registerQrCode
];

models.forEach(modelFn => {
  const model = modelFn(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
