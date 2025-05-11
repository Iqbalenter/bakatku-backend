const firestore = require('./firebase/firestore');

// const addSkills = async (req, res) => {
//     try {
//         const { skills } = req.body; // Menerima daftar skill dari body request

//         if (!Array.isArray(skills) || skills.length === 0) {
//             return res.status(400).json({
//                 code: 400,
//                 status: 'Bad Request',
//                 data: {
//                     message: 'Skills data must be a non-empty array'
//                 }
//             });
//         }

//         // Validasi setiap skill
//         const invalidSkills = skills.filter(skill => typeof skill !== 'string' || skill.trim() === '');
//         if (invalidSkills.length > 0) {
//             return res.status(400).json({
//                 code: 400,
//                 status: 'Bad Request',
//                 data: {
//                     message: 'Each skill must be a non-empty string',
//                     invalidSkills
//                 }
//             });
//         }

//         // Simpan sebagai array bernama all_skill
//         await firestore.collection('skills').doc('skill_data').set({
//             all_skill: skills
//         }, { merge: true });

//         return res.status(200).json({
//             code: 200,
//             status: 'success',
//             data: {
//                 message: 'Skills added successfully.',
//                 count: skills.length
//             }
//         });

//     } catch (error) {
//         console.error('Error adding skills:', error);
//         return res.status(500).json({
//             code: 500,
//             status: 'Internal Server Error',
//             data: {
//                 message: 'Failed to add skills to Firestore.'
//             }
//         });
//     }
// };

// const addCoursesBySkill = async (req, res) => {
//   try {
//     const { coursesBySkill } = req.body;

//     if (!coursesBySkill || typeof coursesBySkill !== 'object' || Array.isArray(coursesBySkill)) {
//       return res.status(400).json({
//         code: 400,
//         status: 'Bad Request',
//         data: { message: 'Payload harus memiliki objek "coursesBySkill" yang berisi key skill dan array courses.' }
//       });
//     }

//     const batch = firestore.batch();
//     let totalCount = 0;

//     // Iterate setiap skill
//     for (const [skill, courses] of Object.entries(coursesBySkill)) {
//       // Validasi nama skill
//       if (typeof skill !== 'string' || !skill.trim()) {
//         return res.status(400).json({
//           code: 400,
//           status: 'Bad Request',
//           data: { message: `Nama skill tidak valid: "${skill}"` }
//         });
//       }

//       // Validasi courses harus array
//       if (!Array.isArray(courses) || courses.length === 0) {
//         return res.status(400).json({
//           code: 400,
//           status: 'Bad Request',
//           data: { message: `Courses untuk skill "${skill}" harus berupa array tidak kosong.` }
//         });
//       }

//       // Validasi setiap objek course  
//       const invalidCourseItems = courses.filter(c =>
//         !c ||
//         typeof c.name !== 'string' || !c.name.trim() ||
//         typeof c.platform !== 'string' || !c.platform.trim() ||
//         typeof c.link !== 'string' || !c.link.trim()
//       );
//       if (invalidCourseItems.length > 0) {
//         return res.status(400).json({
//           code: 400,
//           status: 'Bad Request',
//           data: {
//             message: `Beberapa item course untuk "${skill}" tidak lengkap atau tidak valid.`,
//             invalidItems: invalidCourseItems
//           }
//         });
//       }

//       // Siapkan batch write: simpan/overwrite field "courses" di dokumen skill
//       const docRef = firestore.collection('course').doc(skill);
//       batch.set(docRef, { courses }, { merge: true });
//       totalCount += courses.length;
//     }

//     // Commit batch
//     await batch.commit();

//     return res.status(200).json({
//       code: 200,
//       status: 'Success',
//       data: {
//         message: 'Semua courses berhasil ditambahkan/di-update.',
//         totalCourses: totalCount,
//         skillsUpdated: Object.keys(coursesBySkill).length
//       }
//     });

//   } catch (error) {
//     console.error('Error adding courses by skill:', error);
//     return res.status(500).json({
//       code: 500,
//       status: 'Internal Server Error',
//       data: { message: 'Terjadi kesalahan saat menyimpan data ke Firestore.' }
//     });
//   }
// };

const addProjectsBySkill = async (req, res) => {
  try {
    const { projectsBySkill } = req.body;

    // Validasi struktur payload
    if (!projectsBySkill || typeof projectsBySkill !== 'object' || Array.isArray(projectsBySkill)) {
      return res.status(400).json({
        code: 400,
        status: 'Bad Request',
        data: { message: 'Payload harus memiliki objek "projectsBySkill" yang berisi key skill dan array projects.' }
      });
    }

    const batch = firestore.batch();
    let totalCount = 0;

    // Iterasi setiap skill dan project
    for (const [skill, projects] of Object.entries(projectsBySkill)) {
      if (typeof skill !== 'string' || !skill.trim()) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          data: { message: `Nama skill tidak valid: "${skill}"` }
        });
      }

      // Validasi project array
      if (!Array.isArray(projects) || projects.length === 0) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          data: { message: `Projects untuk skill "${skill}" harus berupa array tidak kosong.` }
        });
      }

      // Validasi tiap item: harus string non-kosong
      const invalidItems = projects.filter(p => typeof p !== 'string' || !p.trim());
      if (invalidItems.length > 0) {
        return res.status(400).json({
          code: 400,
          status: 'Bad Request',
          data: {
            message: `Beberapa item project untuk "${skill}" tidak valid (harus string non-kosong).`,
            invalidItems
          }
        });
      }

      // Tambahkan ke batch write
      const docRef = firestore.collection('Project').doc(skill);
      batch.set(docRef, { projects }, { merge: true });
      totalCount += projects.length;
    }

    // Commit perubahan
    await batch.commit();

    return res.status(200).json({
      code: 200,
      status: 'Success',
      data: {
        message: 'Semua projects berhasil ditambahkan/di-update.',
        totalProjects: totalCount,
        skillsUpdated: Object.keys(projectsBySkill).length
      }
    });

  } catch (error) {
    console.error('Error adding projects by skill:', error);
    return res.status(500).json({
      code: 500,
      status: 'Internal Server Error',
      data: { message: 'Terjadi kesalahan saat menyimpan data ke Firestore.' }
    });
  }
};


module.exports = { 
    // addSkills
    addProjectsBySkill
};
