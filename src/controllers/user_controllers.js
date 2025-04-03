const JWT = require('../helpers/jwt/jwtHelper');
const UserServices = require('../services/user_services');
const { ErrorHandler } = require('../utils/error-handler');
const { randomNumberGenerate } = require('../utils/utils');
const { wrapAsync } = require('../utils/wrapAsync');
const bcrypt = require('bcrypt');

const registerUserByEmail = async (req, res) => {
  const rq = res.locals.json_req;
  const { email, password } = rq;
  const otp = randomNumberGenerate(5);
  let message = 'User registered successfully';
  let resp = null;
  const encryptedPassword = await bcrypt.hash(password, 10);
  resp = await UserServices.createUser({
    email,
    password: encryptedPassword,
    lastVisit: new Date(),
  });

  return res.json({
    data: {
      userID: resp._id,
      message,
    },
  });
};
const loginWithEmail = async (req, res) => {
  const rq = res.locals.json_req;
  const { password } = rq;
  const { userExist } = req;

  if (!userExist)
    throw new ErrorHandler(400, 'User Not Exist. Please Register yourself');

  if (!userExist?.password) throw new Error('Password missing');

  const isMatch = await bcrypt.compare(password, userExist?.password);

  if (!isMatch) throw new ErrorHandler(400, 'Incorrect password');
  const token = JWT.sign({ userID: userExist?._id });

  return res.status(200).json({
    data: {
      user: userExist,
      token,
    },
    message: 'User logged in successfully',
  });
};

const UserController = {
  registerUserByEmail: wrapAsync(registerUserByEmail),
  loginWithEmail: wrapAsync(loginWithEmail),
};

module.exports = UserController;
