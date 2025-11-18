const multer = require("multer");

const storage = multer.memoryStorage(); // keep file in memory buffer
const upload = multer({ storage });

module.exports = upload;