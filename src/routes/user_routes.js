const express = require('express');
const userRouter = express.Router();
const audit = require('../middleware/audit');
const UserController = require('../controllers/user_controllers');
const check_user_exist = require('../middleware/check_user_exist');
const check_signup_user = require('../middleware/check_signup_user.js');

const API = {
  REGISTER_EMAIL_USER: '/register',
  LOGIN_EMAIL: '/login',
};

userRouter.post(
  API.REGISTER_EMAIL_USER,
  audit,
  check_signup_user,
  UserController.registerUserByEmail,
);

userRouter.post(
  API.LOGIN_EMAIL,
  audit,
  check_user_exist,
  UserController.loginWithEmail,
);

module.exports = userRouter;
