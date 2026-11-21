// Student Number: u25143230
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

export const UPLOAD_DIR = path.join(import.meta.dirname, "..", "uploads");

if(!fs.existsSync(UPLOAD_DIR))
{
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
  {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

function imageOnly(req, file, cb)
{
  if(file.mimetype.startsWith("image/"))
  {
    cb(null, true);
  }
  else
  {
    cb(new Error("Only image files are allowed."));
  }
}

export const upload = multer({
  storage,
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 }, //5 MB
});

//removes an uploaded file when its post/avatar is gone (seed images are kept)
export function removeUpload(filename)
{
  if(!filename || filename.startsWith("http")) return;
  if(fs.existsSync(path.join(UPLOAD_DIR, "..", "seed-images", filename))) return;

  fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
}
