const multer = require('multer');

// Store in memory — we process with sharp before sending to Supabase
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB hard limit
});

module.exports = upload;
