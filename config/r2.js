// src/config/r2.js
const { S3Client } = require("@aws-sdk/client-s3");

const r2 = new S3Client({
  region: "auto", // R2 uses "auto"
  endpoint: process.env.R2_ENDPOINT, // e.g. "https://<accountid>.r2.cloudflarestorage.com"
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = r2;