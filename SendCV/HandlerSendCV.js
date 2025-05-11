const firestore = require('../firebase/firestore');
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fileType = require('file-type');
const { create } = require('domain');

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

const sendCv = async (req, res) => {
    try {
        const userId = req.auth.id;
        const userDocRef = firestore.collection('user').doc(userId);
        const userDoc = await userDocRef.get();
        const pdfFile = req.file;

        if (!userDoc.exists) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: 'User not found'
                },
            });
        }

        if (!pdfFile || !pdfFile.path) {
            console.log(pdfFile);
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: 'PDF file is required'
                },
            });
        }

        const fileBuffer = fs.readFileSync(pdfFile.path);
        const fileDetectionType = await fileType.fromBuffer(fileBuffer);
        console.log("Detection MIME Type", fileDetectionType);

        // Perbaikan pengecekan mime type
        if (!fileDetectionType || fileDetectionType.mime !== "application/pdf") {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: 'Only PDF files are accepted.'
                },
            });
        }

        const pdfData = await pdfParse(fileBuffer);
        const data = userDoc.data();
        const interest = data.identity?.skill || [];

        console.log("Skill dari Firestore (identity.skill):", interest);

        const prompt = `
Dokumen berikut adalah CV. Analisis isi dari CV tersebut dan beri penilaian seberapa besar tingkat kecocokan isi CV dengan daftar skill berikut ini: ${interest.join(", ")}.

⚠️ Penting:
- Hanya gunakan skill dari daftar yang diberikan.
- Jangan menambahkan skill lain yang tidak ada di daftar.
- Berikan nilai dalam bentuk persentase kecocokan (0 sampai 100).
- Format output HARUS persis seperti ini (ikuti struktur dan kunci JSON-nya):

{
  "code": 200,
  "message": "cv berhasil dideteksi",
  "data": {
    "skills": {
      "UI": 70,
      "UX": 60,
      "Design": 50
    }
  }
}

Jangan berikan penjelasan tambahan atau output selain JSON di atas.`;

        const combineInput = `${prompt}\n\nExtracted PDF Content:\n${pdfData.text}`;

        const result = await model.generateContent([combineInput]);

        let generateText = result.response.text();
        console.log("Generate Text:", generateText);

        // Perbaikan typo: ganti `generatedText` ke `generateText`
        if (generateText.includes("ini bukan CV Atau Resume!") || generateText.includes("INI BUKAN CV Atau Resume!") || generateText.includes("Ini bukan CV Atau Resume!")) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: "This is not a CV or Resume."
                }
            });
        }

        generateText = generateText.replace(/```json|```/g, "").trim();

        const jsonMatch = generateText.match(/^\{.*\}$/s);

        if (!jsonMatch) {
            console.error("Invalid JSON format detected.");
            console.log("Generated Text (raw):", generateText);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: 'Invalid output format from model.'
                }
            });
        }

        const jsonOutput = jsonMatch[0];

        let parsedOutput;
        try {
            parsedOutput = JSON.parse(jsonOutput);
            const filteredSkills = {};
            interest.forEach(skill => {
                filteredSkills[skill] = parsedOutput.data.skills[skill] || 0;
            });
            parsedOutput.data.skills = filteredSkills;
        } catch (error) {
            console.error("Error parsing generated text as JSON:", error);
            console.log("Generated Text (raw):", generateText); // Debug output yang tidak bisa diparse
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: "Invalid output format from model."
                }
            });
        }

        try {
            const historyScanRef = userDocRef.collection("HistoryScan");
            await historyScanRef.add({
                skills: parsedOutput.data.skills,
                createAt: new Date()
            });
        } catch (firestoreError) {
            console.error("Error saving to Firestore:", firestoreError);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: "Failed to save analysis to database."
                }
            });
        }

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: parsedOutput.data
        });
    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: "Failed to process PDF."
            }
        });
    } finally {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
    }
};

const getSkillDetail = async (req, res) => {
    try {
        const userId = req.auth.id;
        const skillChoice = req.body.skill_choice;

        if (!skillChoice) {
            return res.status(400).json({
                code: 400,
                status: 'Bad Request',
                data: {
                    message: "Skill choice is required"
                }
            });
        }

        const userDocRef = firestore.collection('user').doc(userId);
        const historyScanRef = userDocRef.collection("HistoryScan");

        // Ambil dokumen terbaru berdasarkan createAt
        const snapshot = await historyScanRef.orderBy("createAt", "desc").limit(1).get();
        if (snapshot.empty) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: "No scan history found"
                }
            });
        }

        const latestDoc = snapshot.docs[0];
        const skills = latestDoc.data().skills || {};

        const level = skills[skillChoice];

        if (level === undefined) {
            return res.status(404).json({
                code: 404,
                status: 'Not Found',
                data: {
                    message: `Skill '${skillChoice}' not found in latest history`
                }
            });
        }

        // Gunakan Gemini untuk menjelaskan skill tersebut
        const prompt = `
Buat deskripsi singkat tentang skill "${skillChoice}" berdasarkan tingkat penguasaan pengguna yang tinggi. Gunakan gaya bahasa orang kedua, seolah-olah kamu sedang memberi masukan atau penilaian kepada seseorang. Jangan sebutkan kata 'level', angka, atau nilai apapun dalam deskripsi. Gunakan kata "kamu" alih-alih "saya". Fokus pada bagaimana keterampilan ini mencerminkan kekuatan profesional dan potensi karier pengguna. Tuliskan dalam 2–4 kalimat yang ringkas dan relevan. Hindari bahasa berlebihan, dan gunakan Bahasa Indonesia yang profesional namun tetap ramah.

Contoh:
"Dengan dasar yang kuat dalam pemrograman sisi server dan manajemen basis data, kamu unggul dalam menciptakan aplikasi yang efisien dan skalabel. Keterampilan kamu dalam memecahkan masalah dan perhatian terhadap detail membuat kamu sangat cocok untuk pengembangan backend."`;

        const result = await model.generateContent([prompt]);
        let description = result.response.text().trim();
        description = description.replace(/^```(?:\w+)?|```$/g, '').trim(); // hapus blok markdown
        
        try {
            const SkillChoice = userDocRef.collection("SkillChoice");
            await SkillChoice.add({
                skill_choice: skillChoice,
                level: level,
                description: description,
                createAt: new Date()
            });
        } catch(firestoreError){
            console.error("Error saving to Firestore:", firestoreError);
            return res.status(500).json({
                code: 500,
                status: 'Internal Server Error',
                data: {
                    message: "Failed to save Skill Choice to database."
                }
            });
        }

        return res.status(200).json({
            code: 200,
            data: {
                skill_choice: skillChoice,
                level: level,
                description: description
            }
        });

    } catch (error) {
        console.error("Error retrieving skill detail:", error);
        return res.status(500).json({
            code: 500,
            status: 'Internal Server Error',
            data: {
                message: "Internal server error"
            }
        });
    }
};


module.exports = { sendCv, getSkillDetail };
