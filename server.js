const express = require("express");
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { addProjectsBySkill } = require('./addSkill');

const serviceAccountKey = require('./bakatku-firebase-adminsdk-fbsvc-5529ea8bc9.json');

const app = express();
app.use(express.json());
const port = 3000;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
    });
};

app.post('/addSkills', addProjectsBySkill);


const routesFolders = [
    './User', 
    './Indentity', 
    './SendCV', 
    './ProgressTracker', 
    './Dashboard', 
    './History',
    './ForgotPassword',
    './DataSkill', 
    './SkillDevelopment',
    './RecomendProject'
];

routesFolders.forEach((folder) => {
    const files = fs.readdirSync(path.resolve(__dirname, folder));
    files.forEach((file) => {
        if (file.startsWith('Routes') && file.endsWith('.js')) {
            const router = require(path.resolve(__dirname, folder, file));
            app.use(router);
        }
    });
});


app.listen(port, () => {
    console.log(`Server Running in http://localhost:${port}`);
})

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
})