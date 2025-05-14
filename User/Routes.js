const handler = require('./HandlerUser');
const router = require('express').Router();
const { verifyToken } = require('../utils/jwt');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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
        return res.status(401).json({
            code: 401,
            status: 'Unauthorized',
            data: {
                message: 'Invalid token'
            }
        })
    }
};

router.post('/register', async (req, res) => {
    try {
        const response = await handler.addUser(req.body);
        res.status(response.code).json(response);
    } catch (error) {
        console.log('Error', error);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: error
            },
        })
    }
});

router.post('/login', async (req, res) => {
    try {
        const response = await handler.login(req.body);
        res.status(response.code).json(response);
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: error
            }
        })
    }
});

router.get('/user/:id', validateToken ,async (req, res) => {
    try {
        const { id } = req.params;
        const response = await handler.getUserById(id);
        res.status(response.code).json(response);
    } catch (error) {
        console.log('Error', error);
        return res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: 'Terjadi kesalahan pada server'
            },
        })
    }
})

router.get('/profile', validateToken, async (req, res) => {
    try {
        const response = await handler.getDataProfile(req, res);
        res.status(response.code || 200).json(response);
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: { message: 'Terjadi kesalahan saat mengambil data profil' }
        });
    }
});


router.put('/profile/update', validateToken, upload.single('photo'), async (req, res) => {
    try {
        const response = await handler.editProfile(req, res);
        res.status(response.code || 200).json(response);
    } catch (error) {
        console.error('Error editing profile:', error);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: { message: 'Terjadi kesalahan saat mengedit profil' }
        });
    }
});

router.get('/auth/check', validateToken, (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            message: 'User is authenticated',
            userId: req.auth.id,
            email: req.auth.email
        }
    });
});

router.post('/auth/google', async (req, res) => {
    try {
        await handler.googleLogin(req, res);
    } catch (error) {
        console.error('Error in Google auth route:', error);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: { message: 'Google login failed' }
        });
    }
});




module.exports = router;
