const firestore = require('../firebase/firestore');

const GetDataSkill = async (req, res) => {
    try {
        const docRef = firestore.collection('skills').doc('skill_data');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
        return res.status(404).json({
            code: 404,
            status: 'error',
            data : {
                message: 'Document skill_data not found'
            }
        });
        }

        const data = docSnap.data();
        const allSkills = data.all_skill || [];

        res.status(200).json({
            code: 200,
            status: 'success',
            data: allSkills
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            status: 'Error',
            data: { 
                message: 'Internal server error' 
            }
        });
    }
}

module.exports = {
    GetDataSkill
}