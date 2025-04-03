const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helpers/enums/constant_enums');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
    },
    password: String,
    lastVisit: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = userSchema;
