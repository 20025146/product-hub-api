const mongoose = require('mongoose');
const userSchema = require('./user_model');
const productsSchema = require('./products_model');

const models = {
  Users: mongoose.model('users', userSchema),
  Products: mongoose.model('products', productsSchema),
};
module.exports = models;
