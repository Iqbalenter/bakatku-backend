const { Firestore } = require('@google-cloud/firestore');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

const keyFilepath = path.resolve(__dirname, '../bakatku-firebase-adminsdk-fbsvc-5529ea8bc9.json');
const projectId = process.env.PROJECT_ID;
const databaseId = process.env.DATABASE_ID;


const firestore = new Firestore({
    projectId: projectId,
    keyFilename: keyFilepath,
    databaseId: databaseId,
});

module.exports = firestore;