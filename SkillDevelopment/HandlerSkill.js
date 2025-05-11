// controllers/skillDevelopmentController.js

const firestore = require('../firebase/firestore');

const GetSkillDevelopment = async (req, res) => {
  try {
    // 1. Ambil ID user dari token/auth middleware
    const userId = req.auth.id;

    // 2. Reference ke dokumen user
    const userDocRef = firestore.collection('user').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        code: 404,
        status: 'Not Found',
        data: { message: 'User not found' },
      });
    }

    // 3. Reference ke sub‐collection SkillChoice
    const skillChoiceColRef = userDocRef.collection('SkillChoice');

    // 4. Query history terbaru berdasarkan createAt (descending) → limit 1
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

    // 5. Ambil skill_choice dari dokumen terbaru
    const latestSkillDoc = skillSnap.docs[0];
    const skillKey = latestSkillDoc.get('skill_choice');

    // 6. Reference ke dokumen course sesuai skill_choice
    const courseDocRef = firestore.collection('course').doc(skillKey);
    const courseDoc = await courseDocRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({
        code: 404,
        status: 'Not Found',
        data: { message: `Course '${skillKey}' not found` },
      });
    }

    // 7. Siapkan data course
    const courseData = courseDoc.data();

    // 8. Kirim response sukses
    return res.status(200).json({
      code: 200,
      status: 'Success',
      data:  courseData,
    });

  } catch (error) {
    console.error('Error GetSkillDevelopment:', error);
    return res.status(500).json({
      code: 500,
      status: 'Internal Server Error',
      data: { message: error.message || error },
    });
  }
};

module.exports = {
  GetSkillDevelopment,
};
