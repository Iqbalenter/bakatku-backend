const firestore = require('../firebase/firestore');
const admin = require('firebase-admin');

const addProgress = async (req, res) => {
    try {
        const userId = req.auth.id;
        const { progress } = req.body;
    
        if (!Array.isArray(progress) || progress.length === 0) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: 'Progress data must be a non-empty array'
                }
            });
        }

        try {

            const updates = {};

            for (const item of progress) {
                if (!item.title || typeof item.status !== 'boolean') {
                    return res.status(400).json({
                        code: 400,
                        status: 'Bad Request',
                        data: {
                            message: 'Each progress item must have a valid title and status'
                        }
                    });
                }
                updates[item.title] = item.status;
            }

            await firestore.collection('user').doc(userId).collection('progress').doc('progress_data').set(
                updates, { merge: true }
            );

            return res.status(200).json({
                code: 200,
                status: 'success',
                data: updates
            });
        } catch (firestoreError) {
            console.error("Error saving to Firestore:", firestoreError);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: "Failed to save progress to database."
                }
            });
        }

        
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
};

const updateProgressTitle = async (req, res) => {
    try {
        const userId = req.auth.id;
        const { oldTitle, newTitle } = req.body;

        if (!oldTitle || !newTitle) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: { message: 'Both oldTitle and newTitle are required' }
            });
        }

        const docRef = firestore.collection('user').doc(userId).collection('progress').doc('progress_data');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: { message: 'Progress document not found' }
            });
        }

        const currentData = docSnap.data();

        if (!(oldTitle in currentData)) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: { message: `Field "${oldTitle}" does not exist` }
            });
        }

        // Update dengan title baru dan hapus title lama
        await docRef.update({
            [newTitle]: currentData[oldTitle],
            [oldTitle]: admin.firestore.FieldValue.delete()
        });

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                message: `Title updated from "${oldTitle}" to "${newTitle}"`
            }
        });

    } catch (error) {
        console.error('Error updating title:', error);
        return res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: { message: 'Failed to update title' }
        });
    }
};


module.exports = { addProgress, updateProgressTitle };