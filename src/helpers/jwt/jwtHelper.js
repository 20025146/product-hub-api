const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const SECRET_KEY = config.server.jwtSecretKey; // Replace with your actual secret key

class JWT {
	static sign(payload, expiresIn = '72h') {
		return jwt.sign(payload, SECRET_KEY, { expiresIn });
	}

	static verify(token) {
		try {
			return jwt.verify(token, SECRET_KEY);
		} catch (error) {
			console.error('JWT verification failed:', error);
			return null;
		}
	}
}

module.exports = JWT;
