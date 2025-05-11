const firestore = require('../firebase/firestore');

const fillUserIdentity = async (req, res) => {
    const userId = req.auth.id; // asumsi dari middleware validateToken
    const { work, activity, hobby, experience, skill } = req.body;

    if(!work || !activity || !hobby || !experience || !skill) {
        return res.status(400).json({
            code: 400,
            status: 'Bad Request',
            data: {
                message: 'Missing required fields'
            }
        });
    }

    try {
        await firestore.collection('user').doc(userId).set({
            identity: {
                work,
                activity,
                hobby,
                experience,
                skill,
        }
        }, { merge: true });

        res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                message: 'User identity updated successfully',
                work: work,
                activity: activity,
                hobby: hobby,
                experience: experience,
                skill: skill
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: 'Failed to update user identity'
            }
        });
    }
};

const getUserIdentity = async (req, res) => {
    try {
        const userId = req.auth.id;
        const userDocRef = firestore.collection('user').doc(userId);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists) {
            console.log(userDoc);
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: 'User not found'
                },
            });
        }

        const userData = userDoc.data();
        const userIdentity = userData.identity;

        res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                work: userIdentity.work,
                activity: userIdentity.activity,
                hobby: userIdentity.hobby,
                experience: userIdentity.experience,
                skill: userIdentity.skill
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: 'Failed to get user identity'
            }
        });
    }
}

module.exports = { fillUserIdentity, getUserIdentity };
