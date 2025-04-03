const UserServices = require('../services/user_services');
const { ErrorHandler } = require('../utils/error-handler');

//This middleware is used to validate user that is it exist or not by email
module.exports = async (req, res, next) => {
	const { email = '' } = req.body;
	let userExist = null;

	try {
		if (email) userExist = await UserServices.getUserByEmail(email);

		if (!userExist)
			return next(
				new ErrorHandler(404, 'User does not Exist. Please Register yourself')
			);

		req.userExist = userExist;
	} catch (err) {
		return next(new ErrorHandler(404, 'User does not exist'));
	}

	return next();
};
