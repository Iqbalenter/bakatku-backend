const firestore = require('../firebase/firestore');

const getHistory = async (req, res) => {
   try {
        const userId = req.auth.id;
        const userDocRef = firestore.collection('user').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: 'User not found'
                },
            });
        }

        const skillChoice = userDocRef.collection('SkillChoice');
        
        const snapshot = await skillChoice.orderBy("skill_choice", "desc").get();
        if (snapshot.empty) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: 'No History found'
                },
            })
        }

        const skills = snapshot.docs.map(doc => doc.data().skill_choice);

        res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                skills
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

const getHistoryDetail = async (req, res) => {
    try {
        const userId = req.auth.id;
        const { skill_choice } = req.body;

        if (!skill_choice) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: { 
                    message: 'Missing skill_choice in request body' 
                }
            });
        }

        const userDocRef = firestore.collection('user').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: { 
                    message: 'User not found' 
                }
            });
        }

        const skillChoiceRef = userDocRef.collection('SkillChoice');
        const querySnapshot = await skillChoiceRef.where('skill_choice', '==', skill_choice).limit(1).get();

        if (querySnapshot.empty) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: { 
                    message: `SkillChoice "${skill_choice}" not found` 
                }
            });
        }

        const skillData = querySnapshot.docs[0].data();
        const description = skillData.description;

        const historyRef = userDocRef.collection('HistoryScan');
        const historySnapshot = await historyRef.orderBy('createAt', 'desc').limit(1).get();

        if (historySnapshot.empty) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: { 
                    message: 'No HistoryScan data found' 
                }
            });
        }

        const historyData = historySnapshot.docs[0].data();
        const skills = historyData.skills || {};

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                skill_choice: skill_choice,
                skills: skills,
                description: description
            }
        });

    } catch (error) {
        console.error('Error in getHistoryDetail:', error);
        return res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: { 
                message: error.message || 'Something went wrong' 
            }
        });
    }
}

module.exports = {
    getHistory,
    getHistoryDetail
}