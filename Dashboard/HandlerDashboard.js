const firestore = require('../firebase/firestore');

const getDashboard = async (req, res) => {
    try {
        const userId = req.auth.id;
        const userDocRef = firestore.collection('user').doc(userId);
        const userDoc = await userDocRef.get();

        if(!userDoc.exists) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: 'User not found'
                },
            });
        }

        const skillChoice = userDocRef.collection('SkillChoice');
        
        const snapshot = await skillChoice.orderBy("skill_choice", "desc").limit(1).get();
        if (snapshot.empty) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: 'No History found'
                },
            })
        }

        const latestDoc = snapshot.docs[0];
        const skill = latestDoc.data().skill_choice;
        const description = latestDoc.data().description;

        res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                skill,
                description
            }
        })


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
}

module.exports = { getDashboard };