// Student Number: u25143230
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { connectToMongoDB, getDB, isConnected } from "./db.js";
import { requireAuth } from "./lib/auth.js";
import { UPLOAD_DIR } from "./lib/upload.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import friendRoutes from "./routes/friends.js";
import postRoutes from "./routes/posts.js";
import albumRoutes from "./routes/albums.js";
import feedRoutes from "./routes/feed.js";
import searchRoutes from "./routes/search.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes can always read req.body, even when nothing was sent
app.use((req, res, next) =>
{
  req.body ??= {};
  next();
});

app.use("/uploads", express.static(UPLOAD_DIR));

//api calls wait for the database connection
app.use("/api", (req, res, next) =>
{
  if(!isConnected())
  {
    return res.status(503).json({ error: "Server is still connecting to the database. Please try again in a moment." });
  }
  next();
});

//======================== routes =============================

//signup / login / logout / me work without a session
app.use("/api/auth", authRoutes);

//everything below needs a logged in user
app.use("/api", requireAuth);

app.get("/api/reasons", async(req, res) =>
{
  const reasons = await getDB().collection("reasons").find({}).toArray();
  reasons.sort((a, b) => a.label.localeCompare(b.label));
  res.json(reasons);
});

app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", (req, res) =>
{
  res.status(404).json({ error: "That API route doesn't exist." });
});

//======================== error handler ======================

//turns every thrown error into a JSON message the frontend can show
app.use((err, req, res, next) =>
{
  if(err instanceof multer.MulterError)
  {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "That image is too big (max 5 MB)."
      : err.message;

    return res.status(400).json({ error: message });
  }

  const status = err.status || (err.message === "Only image files are allowed." ? 400 : 500);
  if(status === 500) console.error(err);

  res.status(status).json({ error: status === 500 ? "Something went wrong on the server. Please try again." : err.message });
});

//======================== start ==============================

function copySeedImages()
{
  const SEED_DIR = path.join(import.meta.dirname, "seed-images");

  if(fs.existsSync(SEED_DIR))
  {
    const files = fs.readdirSync(SEED_DIR);
    for(const file of files)
    {
      const src = path.join(SEED_DIR, file);
      const dest = path.join(UPLOAD_DIR, file);
      if(!fs.existsSync(dest))
      {
        fs.copyFileSync(src, dest);
        console.log("Seeded image:", file);
      }
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
  });

  connectWithRetry();
}

startServer();
