import multer from "multer";
import fs from "node:fs";
import path from "path";

// Define the upload directory path
const uploadDir = "uploads";

// Check if the directory exists, and if not, create it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype !== "text/csv") {
    return cb(new Error("Only CSV files are allowed"), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
});
