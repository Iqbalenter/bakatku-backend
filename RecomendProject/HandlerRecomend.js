const firestore = require('../firebase/firestore');

const GetProjectRecommendations = async (req, res) => {
  try {
    // 1. Ambil ID user dari middleware auth
    const userId = req.auth.id;

    // 2. Ambil referensi ke dokumen user
    const userDocRef = firestore.collection('user').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        code: 404,
        status: 'Not Found',
        data: { message: 'User not found' },
      });
    }

    // 3. Referensi ke sub‐collection SkillChoice
    const skillChoiceColRef = userDocRef.collection('SkillChoice');

    // 4. Ambil dokumen skill terbaru (berdasarkan createAt)
    const skillSnap = await skillChoiceColRef
      .orderBy('createAt', 'desc')
      .limit(1)
      .get();

    if (skillSnap.empty) {
      return res.status(404).json({
        code: 404,
        status: 'Not Found',
        data: { message: 'No skill history found' },
      });
    }

    // 5. Ambil nama skill dari dokumen terbaru
    const latestSkillDoc = skillSnap.docs[0];
    const skillKey = latestSkillDoc.get('skill_choice');

    // 6. Ambil dokumen project berdasarkan skill
    const projectDocRef = firestore.collection('Project').doc(skillKey);
    const projectDoc = await projectDocRef.get();

    if (!projectDoc.exists) {
      return res.status(404).json({
        code: 404,
        status: 'Not Found',
        data: { message: `Project recommendations for '${skillKey}' not found` },
      });
    }

    // 7. Ambil data projects
    const projectData = projectDoc.data(); // { projects: [...] }

    // 8. Response sukses
    return res.status(200).json({
      code: 200,
      status: 'Success',
      data: projectData.projects
    });

  } catch (error) {
    console.error('Error GetProjectRecommendations:', error);
    return res.status(500).json({
      code: 500,
      status: 'Internal Server Error',
      data: { message: error.message || error },
    });
  }
};

module.exports = {
  GetProjectRecommendations,
};
