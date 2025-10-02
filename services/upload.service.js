const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const r2 = require("../config/r2");

async function uploadToR2(file) {
  if (!file) return null;

  const uuid = uuidv4(); // generate unique ID
  const key = `${uuid}${getFileExtension(file.originalname)}`;

  const uploadParams = {
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await r2.send(new PutObjectCommand(uploadParams));

  // 🔹 Return only the key (since bucket is private)
  return key;
}

function getFileExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
}

module.exports = { uploadToR2 };
