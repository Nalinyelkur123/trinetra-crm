const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpe?g|png|webp|svg|pdf)$/i;
  const allowedMime = /^(image\/(jpeg|png|webp|svg\+xml|gif)|application\/pdf)$/i;
  const extValid = allowedExts.test(file.originalname);
  const mimeValid = allowedMime.test(file.mimetype);

  if (extValid || mimeValid) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, WEBP, SVG) and PDFs are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
