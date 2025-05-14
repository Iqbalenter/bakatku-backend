const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { createToken } = require('../utils/jwt');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const keyFilepath = path.resolve(__dirname, '../bakatku-firebase-adminsdk-fbsvc-5529ea8bc9.json');
const firestore = new Firestore({
    projectId: process.env.PROJECT_ID,
    keyFilename: keyFilepath,
    databaseId: process.env.DATABASE_ID,
});

const serviceAccount = require(path.resolve(__dirname, '../bakatku-firebase-adminsdk-fbsvc-5529ea8bc9.json'));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'highstuff77@gmail.com',
        pass: 'qsdk popk qcps guhr',
    },
});

const successResponse = (statusCode, data) => {
    return {
        code: statusCode,
        status: 'success',
        data: data,
    };
};

const errorResponse = (code, message) => {
    return {
        code,
        status: 'Error',
        data: { message },
    };
};

const addUser = async (payload) => {
    const { email, name, password } = payload;

    if (!email || !name || !password) {
        return errorResponse(400, 'Missing required fields');
    }

    try {
        const userQuery = await admin.auth().getUserByEmail(email).catch((err) => {
            if (err.code === 'auth/user-not-found') return null;
            throw err;
        });        
        
        if (userQuery) {
            return errorResponse(400, 'Email already in use, Use another email.');
        }

        const authUser = await admin.auth().createUser({ email, password, displayName: name });
        const verificationLink = await admin.auth().generateEmailVerificationLink(email);

        await transporter.sendMail({
            from: 'highstuff77@gmail.com',
            to: email,
            subject: 'Verify your email Bakatku',
            html: `
                <p>Hello ${name},</p>
                <p>Thank you for signing up. Click the link below to verify your email:</p>
                <a href="${verificationLink}">${verificationLink}</a>
                <p>If you didn’t ask to verify this address, you can ignore this email.</p>
                <p>Thanks,</p>
                <p>Your Bakatku team</p>`,
        })

        await firestore.collection('user').doc(authUser.uid).set({
            email,
            name,
            createAt: Firestore.Timestamp.now(),
            emailVerified: false,
        });

        return successResponse(201, {
            message: 'User created successfully, Please verify your email.',
            id: authUser.uid,
        });
    } catch (error) {
        console.error('Error registering user:', error);
        return errorResponse(500, 'Terjadi kesalahan saat registrasi');
    };
}

const getUserById = async (userID) => {
    const userDocRef = firestore.collection('user').doc(userID);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        return {
            code: 404,
            status: 'Not Found',
            data: {
                message: 'User not found'
            },
        }
    };

    const userData = userDoc.data();

    return {
        code: 200,
        status: 'success',
        data: {
            id: userDoc.id,
            email: userData.email,
            name: userData.name,
        }
    }

}


const login = async (payload) => {
    const { email, password } = payload;
    
    if (!email || !password) {
        return {
            code: 400,
            status: 'Bad Request',
            data: {
                message: "Email Or Password Need to fill"
            }
        };
    };

    try {

        const apiKey = 'AIzaSyA2VF4gWA-DbVUnK5hcstlZQRmyqcOVxPs';
        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
        const getUserUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

        const signInRequestBody = {
            email,
            password,
            returnSecureToken: true,
        };

        const signInResponse = await axios.post(signInUrl, signInRequestBody);
        const idToken = signInResponse.data.idToken;
        
        const userInfoResponse = await axios.post(getUserUrl, { idToken });
        const userInfo = userInfoResponse.data.users[0];

        if (!userInfo.emailVerified) {
            return {
                code: 403,
                status: 'Forbidden',
                data: {
                    message: 'Your Email has not verification, Check your email to get verification'
                }
            };
        };

        const userQuery = await firestore.collection('user').where('email', '==', email).get();
        const userDoc = userQuery.docs[0];
        const userData = userDoc ? userDoc.data() : null;

        const token = createToken({
            id: userDoc.id,
            email: userData.email
        })

        return {
            code: 200,
            status: 'Success',
            data: {
                message: 'Login Successful',
                id: userDoc.id,
                token
            },
        };

    }catch (err) {
        console.log('Error logging in user:', err.response?.data || err.message)
        return {
            code: 401,
            status: 'Unauthorized',
            data: {
                message: 'Email atau Password salah'
            },
        }
    }
}

const getDataProfile = async (req, res) => {
    const userId = req.auth.id;
    const userDocRef = firestore.collection('user').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        return {
            code: 404,
            status: 'Not Found',
            data: {
                message: 'User not found'
            },
        }
    };

    const userData = userDoc.data();

    return {
        code: 200,
        status: 'success',
        data: {
            email: userData.email,
            name: userData.name,
            photoUrl: userData.photoUrl
        }
    }
    

}

const editProfile = async (req, res) => {
    try {
        const userId = req.auth.id;
        const { name } = req.body;

        let photoUrl;
        const userDocRef = firestore.collection('user').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                status: 'Not Found',
                data: { message: 'User not found' }
            });
        }

        const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

        if (req.file) {
            const userData = userDoc.data();
            const oldPhotoUrl = userData.photoUrl;

            if (oldPhotoUrl) {
                const decodedPath = decodeURIComponent(oldPhotoUrl.split('/o/')[1].split('?')[0]);
                const oldFile = bucket.file(decodedPath);

                try {
                    await oldFile.delete();
                    console.log(`Old photo deleted: ${decodedPath}`);
                } catch (deleteErr) {
                    console.warn(`Failed to delete old photo: ${decodedPath}`, deleteErr.message);
                }
            }

            // Upload file baru
            const newFileName = `profile_photos/${userId}/${uuidv4()}`;
            const newFile = bucket.file(newFileName);

            await newFile.save(req.file.buffer, {
                metadata: {
                    contentType: req.file.mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: uuidv4()
                    }
                }
            });

            photoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newFileName)}?alt=media`;
        }

        const updateData = {};
        if (name !== undefined && name.trim() !== "") {
            updateData.name = name.trim();
        }
        if (photoUrl) {
            updateData.photoUrl = photoUrl;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                status: 'Bad Request',
                data: { message: 'No data provided to update' }
            });
        }

        await userDocRef.update(updateData);

        return res.status(200).json({
            status: 'success',
            data: {
                message: 'Profile updated successfully',
                ...(photoUrl && { photoUrl }),
                ...(name && { name })
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({
            status: 'Internal Server Error',
            data: {
                message: 'Failed to update profile',
                error: error.message
            }
        });
    }
};

const googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json(errorResponse(400, 'ID Token is required'));
    }

    try {
        // Verifikasi ID Token dari Google
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name, picture, uid } = decodedToken;

        if (!email) {
            return res.status(400).json(errorResponse(400, 'Invalid token: Email not found'));
        }

        // Cari user di Firestore
        let userDoc = await firestore.collection('user').where('email', '==', email).get();

        let userId;

                const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
        if (userDoc.empty) {
            userId = uid;
        
            let photoUrl = '';
            try {
                // Ambil gambar dari Google
                const response = await axios.get(picture, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'binary');
        
                const newFileName = `profile_photos/${userId}/${uuidv4()}.jpg`;
                const file = bucket.file(newFileName);
        
                await file.save(buffer, {
                    metadata: {
                        contentType: 'image/jpeg',
                        metadata: {
                            firebaseStorageDownloadTokens: uuidv4(), // agar URL bisa diakses publik
                        },
                    },
                });
        
                // URL akses publik file dari Firebase Storage
                photoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newFileName)}?alt=media`;
        
            } catch (uploadError) {
                console.warn('Gagal upload foto dari Google:', uploadError.message);
            }
        
            // Simpan user baru
            await firestore.collection('user').doc(userId).set({
                email,
                name: name || '',
                photoUrl,
                emailVerified: true,
                createdAt: Firestore.Timestamp.now()
            });
        } else {
            userId = userDoc.docs[0].id;
        }

        // Generate JWT token untuk client
        const token = createToken({
            id: userId,
            email
        });

        return res.status(200).json(successResponse(200, {
            message: 'Google login successful',
            token,
            id: userId,
            email,
            name
        }));
    } catch (error) {
        console.error('Google login error:', error);
        return res.status(401).json(errorResponse(401, 'Invalid Google token'));
    }
};




module.exports = {
    addUser, getUserById, login, getDataProfile, editProfile, googleLogin
};
