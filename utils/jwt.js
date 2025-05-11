const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

const createToken = (payload) => {
    return jwt.sign(payload, secretKey);
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    createToken,
    verifyToken,
};