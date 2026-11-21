// Student Number: u25143230
//the express app on its own (no listening, no database connection) so tests can use it
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { getDB, isConnected } from "./db.js";
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

//behind a host's proxy (like Render) this makes req.secure true, so cookies get the Secure flag
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes can always read req.body, even when nothing was sent
app.use((req, res, next) =>
{
  req.body ??= {};
  next();
});

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

//used by the host and the CI pipeline to check the app is up
app.get("/api/health", (req, res) =>
{
  const ready = isConnected();
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "starting", database: ready ? "connected" : "connecting" });
});

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

//======================== built frontend =====================

//in production the backend also serves the built React app (one service, one address)
const STATIC_DIR = process.env.STATIC_DIR;

if(STATIC_DIR && fs.existsSync(path.join(STATIC_DIR, "index.html")))
{
  //vite puts a hash in asset names, so they can be cached for a long time
  app.use("/assets", express.static(path.join(STATIC_DIR, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(STATIC_DIR, { index: false, maxAge: "1d" }));

  //every other page is handled by React Router
  app.use((req, res, next) =>
  {
    if(req.method !== "GET" || req.path.startsWith("/uploads/")) return next();
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });
}

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

export default app;
