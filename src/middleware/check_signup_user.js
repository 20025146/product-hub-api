const UserServices = require('../services/user_services');
const { ErrorHandler } = require('../utils/error-handler');

//This middleware is used to validate user that is it exist or not by email
module.exports = async (req, res, next) => {
  const { email = '' } = req.body;
  let userExist = null;

  try {
    if (email) userExist = await UserServices.getUserByEmail(email);

    if (userExist) return next(new ErrorHandler(409, 'User already Exist'));
  } catch (err) {
    return next(new ErrorHandler(409, 'User already exist'));
  }

  return next();
};
