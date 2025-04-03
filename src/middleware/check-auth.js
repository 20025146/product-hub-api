const config = require('../config/config');
const JWT = require('../helpers/jwt/jwtHelper');
const UserServices = require('../services/user_services');
const { ErrorHandler } = require('../utils/error-handler');
const jwt = require('jsonwebtoken');

//This middleware is used to validate incoming JSON Web Token & only allow further if token is valid
module.exports = async (req, res, next) => {
	const authHeader = req.header('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		return res.status(403).json({ error: 'Token not found' });
	}

	try {
		const decoded = JWT.verify(token, config.server.jwtSecretKey); //Verify JWT using private key;
		const userObj = await UserServices.getUserByID(decoded?.userID);
		if (!userObj) {
			return next(new ErrorHandler(401));
		}

		if (userObj.isDeleted)
			return next(new Error('Your account is deleted. Register new account'));

		req.user = userObj;
	} catch (err) {
		console.log(err);
		return next(new ErrorHandler(401));
	}

	return next();
};
