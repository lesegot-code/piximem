// Student Number: u25143230
import path from "node:path";
import fs from "node:fs";
import app from "./app.js";
import { connectToMongoDB } from "./db.js";
import { UPLOAD_DIR, usingCloudStorage } from "./lib/upload.js";

const PORT = process.env.PORT || 3000;

//demo photos used by the seed data are served from /uploads
function copySeedImages()
{
  const SEED_DIR = path.join(import.meta.dirname, "seed-images");

  if(fs.existsSync(SEED_DIR))
  {
    for(const file of fs.readdirSync(SEED_DIR))
    {
      const dest = path.join(UPLOAD_DIR, file);
      if(!fs.existsSync(dest)) fs.copyFileSync(path.join(SEED_DIR, file), dest);
    }
  }
}

//keeps trying until MongoDB connects
async function connectWithRetry()
{
  try
  {
    await connectToMongoDB();
  }
  catch
  {
    console.log("Retrying MongoDB connection in 5 seconds...");
    console.log("Check MONGODB_URI in backend/.env and Atlas Network Access (allow your IP).");
    setTimeout(connectWithRetry, 5000);
  }
}

function startServer()
{
  copySeedImages();

  //listen straight away so the frontend always gets a reply
  app.listen(PORT, () =>
  {
    console.log(`Backend running on port ${PORT}`);
    console.log(usingCloudStorage ? "Uploads go to Cloudinary" : "Uploads are saved in backend/uploads");
  });

  connectWithRetry();
}

startServer();
