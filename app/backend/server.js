// Student Number: u25143230
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { ObjectId } from "mongodb";
import { connectToMongoDB, getDB } from "./db.js";

const app = express();
const UPLOAD_DIR = path.join(import.meta.dirname, "uploads");

if(!fs.existsSync(UPLOAD_DIR))
{
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(UPLOAD_DIR));

//======================== multer =============================

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

const upload = multer({
  storage,
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 }, //5 MB
});

//======================== helpers ============================

function isValidObjectId(id)
{
  return ObjectId.isValid(id);
}

//build full image URL (so the browser can load it)
function imageUrl(req, filename)
{
  if(!filename) return null;
  //if already a full URL, leave it
  if(filename.startsWith("http")) return filename;
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

//======================== users ==============================

app.get("/api/users", async(req, res) =>
{
  try
  {
    const db = getDB();
    const allUsers = await db.collection("users").find({}).toArray();
    res.json(allUsers);
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/signup", async(req, res) =>
{
  try
  {
    const { email, password, username } = req.body;

    if(!email || !password || !username)
    {
      return res.status(400).json({ error: "All fields are required" });
    }

    const db = getDB();
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if(existing)
    {
      return res.status(400).json({ error: "Email already registered" });
    }

    //start every user with a generated avatar
    const newUser = {
      email,
      password,
      username,
      bio: "",
      avatar: null,
      friends: [],
      friendRequests: [],
      isAdmin: false,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    res.json({
      _id: result.insertedId,
      email,
      username,
      avatar: null,
    });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/login", async(req, res) =>
{
  try
  {
    const { email, password } = req.body;

    if(!email || !password)
    {
      return res.status(400).json({ error: "Email and password required" });
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ email, password });

    if(!user)
    {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    //return full user object
    //prevent second fetch from frontend
    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar || null,
        isAdmin: user.isAdmin || false,
      },
      token: "dummy-token",
    });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/users/:id", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });

    if(!user)
    {
      return res.status(404).json({ error: "User not found" });
    }

    // never send the password back
    const { password, ...safeUser } = user;
    res.json(safeUser);
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

//update profile - accepts multipart so avatar can be uploaded
app.put("/api/users/:id", upload.single("avatar"), async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const db = getDB();

    //build updates only from what was sent (nothing else gets overwritten)
    const updates = {};
    if(req.body.username !== undefined) updates.username = req.body.username;
    if(req.body.bio !== undefined) updates.bio = req.body.bio;
    if(req.file) updates.avatar = req.file.filename;

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if(result.matchedCount === 0)
    {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "Profile updated" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.delete("/api/users/:id", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const db = getDB();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });

    if(result.deletedCount === 0)
    {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

//======================== posts ==============================

app.get("/api/posts", async(req, res) =>
{
  try
  {
    const db = getDB();
    const posts = await db.collection("posts").find({}).toArray();

    //attach image URLs so frontend can just use post.imageUrl
    const enriched = posts.map((p) => ({
      ...p,
      imageUrl: imageUrl(req, p.image),
    }));

    res.json(enriched);
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

//get one post
app.get("/api/posts/:id", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const db = getDB();
    const post = await db.collection("posts").findOne({ _id: new ObjectId(id) });

    if(!post)
    {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ ...post, imageUrl: imageUrl(req, post.image) });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

//create post: accepts multipart so image can be uploaded
app.post("/api/posts", upload.single("image"), async(req, res) =>
{
  try
  {
    const { userId, caption, hashtags } = req.body;

    if(!userId || !caption)
    {
      return res.status(400).json({ error: "User and caption required" });
    }

    if(!isValidObjectId(userId))
    {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if(!req.file)
    {
      return res.status(400).json({ error: "Please upload an image" });
    }

    const db = getDB();

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if(!user)
    {
      return res.status(404).json({ error: "User not found" });
    }

    //hashtags can come as JSON string in multipart form
    let parsedHashtags = [];
    if(hashtags)
    {
      try
      {
        parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;
      }
      catch
      {
        //split if: plain comma string
        parsedHashtags = hashtags.split(",").map((h) => h.trim()).filter(Boolean);
      }
    }

    const newPost = {
      userId: new ObjectId(userId),
      caption,
      hashtags: parsedHashtags,
      image: req.file.filename,
      comments: [],
      reports: [],
      createdAt: new Date(),
    };

    const result = await db.collection("posts").insertOne(newPost);

    res.json({
      _id: result.insertedId,
      ...newPost,
      imageUrl: imageUrl(req, newPost.image),
    });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

//update post caption/hashtags (not image)
app.put("/api/posts/:id", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const { caption, hashtags } = req.body;
    const db = getDB();

    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $set: { caption, hashtags } }
    );

    if(result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true, message: "Post updated" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

app.delete("/api/posts/:id", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const db = getDB();
    const result = await db.collection("posts").deleteOne({ _id: new ObjectId(id) });

    if(result.deletedCount === 0)
    {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true, message: "Post deleted" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.post("/api/posts/:id/comments", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const { userId, text } = req.body;

    if(!userId || !text)
    {
      return res.status(400).json({ error: "User and text required" });
    }

    if(!isValidObjectId(userId))
    {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const db = getDB();

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if(!user)
    {
      return res.status(404).json({ error: "User not found" });
    }

    const comment = {
      _id: new ObjectId(),
      userId: new ObjectId(userId),
      username: user.username,
      text,
      createdAt: new Date(),
    };

    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } }
    );

    if(result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true, comment });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.post("/api/posts/:id/report", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const { userId, reason } = req.body;

    if(!userId || !reason)
    {
      return res.status(400).json({ error: "User and reason required" });
    }

    if(!isValidObjectId(userId))
    {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const db = getDB();
    const post = await db.collection("posts").findOne({ _id: new ObjectId(id) });
    if(!post)
    {
      return res.status(404).json({ error: "Post not found" });
    }

    const report = {
      userId: new ObjectId(userId),
      reason,
      createdAt: new Date(),
    };

    await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $push: { reports: report } }
    );

    res.json({ success: true, report });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to report post" });
  }
});

//======================== albums =============================

app.get("/api/albums", async(req, res) =>
{
  try
  {
    const db = getDB();
    const albums = await db.collection("albums").find({}).toArray();
    res.json(albums);
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

app.post("/api/albums", async(req, res) =>
{
  try
  {
    const { userId, name, description, hashtags } = req.body;

    if(!userId || !name)
    {
      return res.status(400).json({ error: "User and album name required" });
    }

    if(!isValidObjectId(userId))
    {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if(!user)
    {
      return res.status(404).json({ error: "User not found" });
    }

    const newAlbum = {
      userId: new ObjectId(userId),
      name,
      description: description || "",
      hashtags: hashtags || [],
      posts: [],
      createdAt: new Date(),
    };

    const result = await db.collection("albums").insertOne(newAlbum);
    res.json({ _id: result.insertedId, ...newAlbum });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to create album" });
  }
});

app.put("/api/albums/:id", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid album id" });
    }

    const { name, description, hashtags } = req.body;
    const db = getDB();

    const result = await db.collection("albums").updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, description, hashtags } }
    );

    if(result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Album updated" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to update album" });
  }
});

app.put("/api/albums/:id/posts", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid album id" });
    }

    const { postId } = req.body;

    if(!postId || !isValidObjectId(postId))
    {
      return res.status(400).json({ error: "Valid post id required" });
    }

    const db = getDB();
    const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
    if(!post)
    {
      return res.status(404).json({ error: "Post not found" });
    }

    const result = await db.collection("albums").updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { posts: postId } }
    );

    if(result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Post added to album" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to add post to album" });
  }
});

app.delete("/api/albums/:id/posts/:postId", async(req, res) =>
{
  try
  {
    const { id, postId } = req.params;

    if(!isValidObjectId(id) || !isValidObjectId(postId))
    {
      return res.status(400).json({ error: "Invalid id" });
    }

    const db = getDB();
    const result = await db.collection("albums").updateOne(
      { _id: new ObjectId(id) },
      { $pull: { posts: postId } }
    );

    if(result.matchedCount === 0)
    {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Post removed from album" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to remove post from album" });
  }
});

app.delete("/api/albums/:id", async(req, res) =>
{
  try
  {
    const { id } = req.params;

    if(!isValidObjectId(id))
    {
      return res.status(400).json({ error: "Invalid album id" });
    }

    const db = getDB();
    const result = await db.collection("albums").deleteOne({ _id: new ObjectId(id) });

    if(result.deletedCount === 0)
    {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Album deleted" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to delete album" });
  }
});

//======================== friends ============================

app.post("/api/friends/:id/request", async(req, res) =>
{
  try
  {
    const { fromUserId } = req.body;
    const toUserId = req.params.id;

    if(!fromUserId || !isValidObjectId(fromUserId) || !isValidObjectId(toUserId))
    {
      return res.status(400).json({ error: "Invalid user ids" });
    }

    if(fromUserId === toUserId)
    {
      return res.status(400).json({ error: "Cannot send a friend request to yourself" });
    }

    const db = getDB();
    const users = db.collection("users");

    const recipient = await users.findOne({ _id: new ObjectId(toUserId) });
    if(!recipient)
    {
      return res.status(404).json({ error: "Recipient not found" });
    }

    //prevent multiple sends (only send once)
    const alreadyFriends = (recipient.friends || []).some(
      (f) => f.toString() === fromUserId
    );
    if(alreadyFriends)
    {
      return res.status(400).json({ error: "You are already friends" });
    }

    await users.updateOne(
      { _id: new ObjectId(toUserId) },
      { $addToSet: { friendRequests: new ObjectId(fromUserId) } }
    );

    res.json({ success: true, message: "Friend request sent" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

app.put("/api/friends/:id/accept", async(req, res) =>
{
  try
  {
    const { fromUserId } = req.body;
    const toUserId = req.params.id;

    if(!fromUserId || !isValidObjectId(fromUserId) || !isValidObjectId(toUserId))
    {
      return res.status(400).json({ error: "Invalid user ids" });
    }

    const db = getDB();
    const users = db.collection("users");

    const recipient = await users.findOne({ _id: new ObjectId(toUserId) });
    if(!recipient)
    {
      return res.status(404).json({ error: "Recipient not found" });
    }

    const hasRequest = (recipient.friendRequests || []).some(
      (f) => f.toString() === fromUserId
    );
    if(!hasRequest)
    {
      return res.status(400).json({ error: "Friend request not found" });
    }

    await users.updateOne(
      { _id: new ObjectId(toUserId) },
      {
        $pull: { friendRequests: new ObjectId(fromUserId) },
        $addToSet: { friends: new ObjectId(fromUserId) },
      }
    );

    await users.updateOne(
      { _id: new ObjectId(fromUserId) },
      { $addToSet: { friends: new ObjectId(toUserId) } }
    );

    res.json({ success: true, message: "Friend request accepted" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
});

//decline friend request
app.delete("/api/friends/:id/decline", async(req, res) =>
{
  try
  {
    const { fromUserId } = req.body;
    const toUserId = req.params.id;

    if(!fromUserId || !isValidObjectId(fromUserId) || !isValidObjectId(toUserId))
    {
      return res.status(400).json({ error: "Invalid user ids" });
    }

    const db = getDB();
    await db.collection("users").updateOne(
      { _id: new ObjectId(toUserId) },
      { $pull: { friendRequests: new ObjectId(fromUserId) } }
    );

    res.json({ success: true, message: "Friend request declined" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to decline friend request" });
  }
});

app.delete("/api/friends/:id/remove", async(req, res) =>
{
  try
  {
    const { fromUserId } = req.body;
    const toUserId = req.params.id;

    if(!fromUserId || !isValidObjectId(fromUserId) || !isValidObjectId(toUserId))
    {
      return res.status(400).json({ error: "Invalid user ids" });
    }

    if(fromUserId === toUserId)
    {
      return res.status(400).json({ error: "Cannot unfriend yourself" });
    }

    const db = getDB();
    const users = db.collection("users");

    await users.updateOne(
      { _id: new ObjectId(toUserId) },
      { $pull: { friends: new ObjectId(fromUserId) } }
    );

    await users.updateOne(
      { _id: new ObjectId(fromUserId) },
      { $pull: { friends: new ObjectId(toUserId) } }
    );

    res.json({ success: true, message: "Unfriended successfully" });
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({ error: "Failed to unfriend user" });
  }
});

//======================== error handler ======================

//catches multer errors and other errors
app.use((err, req, res, next) =>
{
  if(err instanceof multer.MulterError)
  {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "That image is too big (max 5 MB)."
      : err.message;

    return res.status(400).json({ error: message });
  }

  res.status(400).json({ error: err.message });
});

//======================== start ==============================

async function startServer()
{
  await connectToMongoDB();

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

  app.listen(3000, () =>
  {
    console.log("Backend running on port 3000");
  });
}

startServer();