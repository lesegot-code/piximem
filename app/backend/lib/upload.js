// Student Number: u25143230
//uploads are saved to backend/uploads, or to Cloudinary when CLOUDINARY_URL is set (for hosting)
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

export const UPLOAD_DIR = path.join(import.meta.dirname, "..", "uploads");
const SEED_DIR = path.join(import.meta.dirname, "..", "seed-images");

if(!fs.existsSync(UPLOAD_DIR))
{
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

//CLOUDINARY_URL looks like cloudinary://API_KEY:API_SECRET@CLOUD_NAME
export function parseCloudinaryUrl(value)
{
  if(!value) return null;
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(value.trim());
  if(!match) throw new Error("CLOUDINARY_URL should look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME");
  return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
}

const cloud = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
const FOLDER = process.env.CLOUDINARY_FOLDER || "pixel-memory";
export const usingCloudStorage = Boolean(cloud);

//cloudinary signs requests with sha1 of the sorted parameters + the secret
export function signParams(params, apiSecret)
{
  const text = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(text + apiSecret).digest("hex");
}

//".../upload/v1712/pixel-memory/abc.jpg" -> "pixel-memory/abc"
export function publicIdFromUrl(url)
{
  const match = /\/image\/upload\/(?:[^/]*,[^/]*\/)?(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(url);
  return match ? match[1] : null;
}

const diskStorage = multer.diskStorage({
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

//with Cloudinary the file stays in memory until it is sent on
export const upload = multer({
  storage: usingCloudStorage ? multer.memoryStorage() : diskStorage,
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 }, //5 MB
});

async function uploadToCloudinary(file)
{
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: FOLDER, timestamp };

  const form = new FormData();
  form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append("api_key", cloud.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", FOLDER);
  form.append("signature", signParams(params, cloud.apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if(!res.ok || !data.secure_url)
  {
    console.error("Cloudinary upload failed:", data.error?.message || res.status);
    throw new Error("The photo couldn't be uploaded. Please try again.");
  }

  //ask Cloudinary for a web friendly size and format when it's shown
  return data.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_1600/");
}

//returns what gets saved in the database: a filename (disk) or a full URL (Cloudinary)
export async function storeUpload(file)
{
  if(!file) return null;
  return usingCloudStorage ? uploadToCloudinary(file) : file.filename;
}

//for a file that was received but won't be used (e.g. the form had an error)
export function discardUpload(file)
{
  if(file && !usingCloudStorage) fs.unlink(path.join(UPLOAD_DIR, file.filename), () => {});
}

//removes an uploaded file when its post/avatar is gone (seed images are kept)
export function removeUpload(stored)
{
  if(!stored) return;

  if(stored.startsWith("http"))
  {
    const publicId = publicIdFromUrl(stored);
    if(!cloud || !publicId || !stored.includes(`/${cloud.cloudName}/`)) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", cloud.apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signParams({ public_id: publicId, timestamp }, cloud.apiSecret));

    //deleting in the background is fine, a leftover image is harmless
    fetch(`https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/destroy`, { method: "POST", body: form })
      .catch((err) => console.error("Cloudinary delete failed:", err.message));
    return;
  }

  if(fs.existsSync(path.join(SEED_DIR, stored))) return;
  fs.unlink(path.join(UPLOAD_DIR, stored), () => {});
}
