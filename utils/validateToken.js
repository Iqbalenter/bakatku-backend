const verifyToken = require('./jwt').verifyToken;

const validateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({ 
            code: 401,
            status: 'Unauthorized',
            data: {
                message: 'Token not found'
            },
        });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = verifyToken(token);
        req.auth = decoded;
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({
            code: 401,
            status: 'Unauthorized',
            data: {
                message: 'Invalid token'
            }
        })
    }
};

module.exports = validateToken;