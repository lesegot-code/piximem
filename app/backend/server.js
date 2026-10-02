// Student number: 25143230
import{ ObjectId } from "mongodb";
import express from "express";
import{ connectToMongoDB, getDB } from "./db.js";

const app = express();
app.use(express.json());

function isValidObjectId(id){
  return ObjectId.isValid(id);
}

app.get("/api/users", async(req, res) => {
  try{
    const db = getDB();
    const users = db.collection("users");

    //fetch all users
    const allUsers = await users.find({}).toArray();
    res.json(allUsers);
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/signup", async(req, res) => {
  try{
    const { email, password, username } = req.body;
    if(!email || !password || !username){
      return res.status(400).json({ error: "All fields are required" });
    }

    const db = getDB();
    const users = db.collection("users");

    // Check if user already exists
    const existing = await users.findOne({ email });
    if(existing){
      return res.status(400).json({ error: "Email already registered" });
    }

    const newUser = { email, password, username, friends: [] };
    const result = await users.insertOne(newUser);

    res.json({ _id: result.insertedId, email, username });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/login", async(req, res) => {
  try{
    const { email, password } = req.body;
    if(!email || !password){
      return res.status(400).json({ error: "Email and password required" });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ email, password });
    if(!user){
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ success: true, userId: user._id, token: "dummy-token" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/users/:id", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(id) });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

app.put("/api/users/:id", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const { username, bio } = req.body;
    const db = getDB();
    const users = db.collection("users");

    const result = await users.updateOne(
    { _id: new ObjectId(id) },
    { $set:{ username, bio } }
    );

    if(result.matchedCount === 0){
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "Profile updated" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.delete("/api/users/:id", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const users = db.collection("users");

    const result = await users.deleteOne({ _id: new ObjectId(id) });
    if(result.deletedCount === 0){
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

//=======================       POSTS      ======================================
//=======================       POSTS      ======================================
//=======================       POSTS      ======================================

app.get("/api/posts", async(req, res) => {
  try{
    const db = getDB();
    const posts = await db.collection("posts").find({}).toArray();
    res.json(posts);
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.post("/api/posts", async(req, res) => {
  try{
    const { userId, caption, hashtags } = req.body;
    if(!userId || !caption){
      return res.status(400).json({ error: "User and caption required" });
    }

    if(!isValidObjectId(userId)){
      return res.status(400).json({ error: "User ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }

    const newPost = {
      userId: new ObjectId(userId),
      caption,
      hashtags: hashtags || [],
      comments: [],
      reports: [],
      createdAt: new Date()
    };

    const result = await db.collection("posts").insertOne(newPost);
    res.json({ _id: result.insertedId, ...newPost });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.put("/api/posts/:id", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const { caption, hashtags } = req.body;
    const db = getDB();

    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $set:{ caption, hashtags } }
    );

    if(result.matchedCount === 0){
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true, message: "Post updated" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

app.delete("/api/posts/:id", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const result = await db.collection("posts").deleteOne({ _id: new ObjectId(id) });

    if(result.deletedCount === 0){
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true, message: "Post deleted" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.post("/api/posts/:id/comments", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "Post ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const { userId, text } = req.body;
    if(!userId || !text){
      return res.status(400).json({ error: "User and text required" });
    }

    if(!isValidObjectId(userId)){
      return res.status(400).json({ error: "User ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();

    const post = await db.collection("posts").findOne({ _id: new ObjectId(id) });
    if(!post){
      return res.status(404).json({ error: "Post not found" });
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }

    const comment = {
      userId: new ObjectId(userId),
      text,
      createdAt: new Date()
    };

    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $push:{ comments: comment } }
    );

    if(result.matchedCount === 0){
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true, comment });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.post("/api/posts/:id/report", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "Post ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const { userId, reason } = req.body;
    if(!userId || !reason){
      return res.status(400).json({ error: "User and reason required" });
    }
    
    if(!isValidObjectId(userId)){
      return res.status(400).json({ error: "User ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();

    const post = await db.collection("posts").findOne({ _id: new ObjectId(id) });
    if(!post){
      return res.status(404).json({ error: "Post not found" });
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }

    const report = {
      userId: new ObjectId(userId),
      reason,
      createdAt: new Date()
    };

    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $push:{ reports: report } }
    );

    if(result.matchedCount === 0){
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true, report });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to report post" });
  }
});

//=======================       AlBUM      ======================================
//=======================       AlBUM      ======================================
//=======================       AlBUM      ======================================

app.get("/api/albums", async(req, res) => {
  try{
    const db = getDB();
    const albums = await db.collection("albums").find({}).toArray();
    res.json(albums);
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

app.post("/api/albums", async(req, res) => {
  try{
    const { userId, name, description, hashtags } = req.body;
    if(!userId || !name){
      return res.status(400).json({ error: "User and album name required" });
    }

    if(!isValidObjectId(userId)){
      return res.status(400).json({ error: "User ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }

    const newAlbum = {
      userId: new ObjectId(userId),
      name,
      description: description || "",
      hashtags: hashtags || [],
      posts: [],
      createdAt: new Date()
    };

    const result = await db.collection("albums").insertOne(newAlbum);
    res.json({ _id: result.insertedId, ...newAlbum });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to create album" });
  }
});

app.put("/api/albums/:id", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "Album ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const { name, description, hashtags } = req.body;
    const db = getDB();

    const result = await db.collection("albums").updateOne(
      { _id: new ObjectId(id) },
      { $set:{ name, description, hashtags } }
    );

    if(result.matchedCount === 0){
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Album updated" });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to update album" });
  }
});

//add post to album
app.put("/api/albums/:id/posts", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "Album ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const { postId } = req.body;
    if(!postId){
      return res.status(400).json({ error: "Post ID required" });
    }

    if(!isValidObjectId(postId)){
      return res.status(400).json({ error: "Post ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }
    
    const db = getDB();

    const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
    if(!post){
      return res.status(404).json({ error: "Post not found" });
    }

    const result = await db.collection("albums").updateOne(
      { _id: new ObjectId(id) },
      { $addToSet:{ posts: postId } } // addToSet prevents duplicates
    );

    if(result.matchedCount === 0){
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Post added to album" });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to add post to album" });
  }
});

//remove post from album
app.delete("/api/albums/:id/posts/:postId", async(req, res) => {
  try{
    const { id , postId } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "Album ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    if(!isValidObjectId(postId)){
      return res.status(400).json({ error: "Post ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();

    //check if post exists
    const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
    if(!post){
      return res.status(404).json({ error: "Post not found" });
    }

    //check if post is in album
    const album = await db.collection("albums").findOne({ _id: new ObjectId(id) });
    if(!album){
      return res.status(404).json({ error: "Album not found" });
    }

    if(!album.posts.includes(postId)){
      return res.status(400).json({ error: "Post is not in the album" });
    }

    const result = await db.collection("albums").updateOne(
      { _id: new ObjectId(id) },
      { $pull:{ posts: postId } }
    );

    if(result.matchedCount === 0){
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Post removed from album" });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to remove post from album" });
  }
});

//delete album
app.delete("/api/albums/:id", async(req, res) => {
  try{
    const { id } = req.params;

    if(!isValidObjectId(id)){
      return res.status(400).json({ error: "Album ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const result = await db.collection("albums").deleteOne({ _id: new ObjectId(id) });

    if(result.deletedCount === 0){
      return res.status(404).json({ error: "Album not found" });
    }

    res.json({ success: true, message: "Album deleted" });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to delete album" });
  }
});

//=======================       FRIENDS      =====================================
//=======================       FRIENDS      =====================================
//=======================       FRIENDS      =====================================

// Send friend request
app.post("/api/friends/:id/request", async(req, res) => {
  try{
    const { fromUserId } = req.body;
    const toUserId = req.params.id;

    if(!fromUserId){
      return res.status(400).json({ error: "Sender user ID required" });
    }

    if(!isValidObjectId(fromUserId)){
      return res.status(400).json({ error: "Sender user ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    if(!isValidObjectId(toUserId)){
      return res.status(400).json({ error: "Recipient user ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const users = db.collection("users");

    const sender = await users.findOne({ _id: new ObjectId(fromUserId) });
    if(!sender){
      return res.status(404).json({ error: "Sender not found" });
    }

    const recipient = await users.findOne({ _id: new ObjectId(toUserId) });
    if(!recipient){
      return res.status(404).json({ error: "Recipient not found" });
    }

    if(fromUserId === toUserId){
      return res.status(400).json({ error: "Cannot send a friend request to yourself" });
    }

    const result = await users.updateOne(
      { _id: new ObjectId(toUserId) },
      { $addToSet:{ friendRequests: fromUserId } }
    );

    res.json({ success: true, message: "Friend request sent" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Accept friend request
app.put("/api/friends/:id/accept", async(req, res) => {
  try{
    const { fromUserId } = req.body;
    const toUserId = req.params.id;

    if(!fromUserId){
      return res.status(400).json({ error: "Sender user ID required" });
    }

    if(!isValidObjectId(fromUserId)){
      return res.status(400).json({ error: "Sender user ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    if(!isValidObjectId(toUserId)){
      return res.status(400).json({ error: "Recipient user ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const users = db.collection("users");

    const sender = await users.findOne({ _id: new ObjectId(fromUserId) });
    if(!sender){
      return res.status(404).json({ error: "Sender not found" });
    }

    const recipient = await users.findOne({ _id: new ObjectId(toUserId) });
    if(!recipient){
      return res.status(404).json({ error: "Recipient not found" });
    }

    if(!recipient.friendRequests || !recipient.friendRequests.includes(fromUserId)){
      return res.status(400).json({ error: "Friend request not found" });
    }

    await users.updateOne(
      { _id: new ObjectId(toUserId) },
      {
        $pull:{ friendRequests: fromUserId },
        $addToSet:{ friends: fromUserId }
      }
    );

    await users.updateOne(
      { _id: new ObjectId(fromUserId) },
      { $addToSet:{ friends: toUserId } }
    );

    res.json({ success: true, message: "Friend request accepted" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
});

// Unfriend
app.delete("/api/friends/:id/remove", async(req, res) => {
  try{
    const { fromUserId } = req.body;
    const toUserId = req.params.id;

    if(!fromUserId){
      return res.status(400).json({ error: "User ID required" });
    }

    if(!isValidObjectId(fromUserId)){
      return res.status(400).json({ error: "User ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    if(!isValidObjectId(toUserId)){
      return res.status(400).json({ error: "Recipient user ID is not a valid MongoDB ObjectId(must be 24-character string)" });
    }

    const db = getDB();
    const users = db.collection("users");

    if(fromUserId === toUserId){
      return res.status(400).json({ error: "Cannot unfriend yourself" });
    }

    const sender = await users.findOne({ _id: new ObjectId(fromUserId) });
    if(!sender){
      return res.status(404).json({ error: "User not found" });
    }

    const recipient = await users.findOne({ _id: new ObjectId(toUserId) });
    if(!recipient){
      return res.status(404).json({ error: "Recipient not found" });
    }

    await users.updateOne(
      { _id: new ObjectId(toUserId) },
      { $pull:{ friends: fromUserId } }
    );

    await users.updateOne(
      { _id: new ObjectId(fromUserId) },
      { $pull:{ friends: toUserId } }
    );

    res.json({ success: true, message: "Unfriended successfully" });
  } 
  catch(err){
    console.error(err);
    res.status(500).json({ error: "Failed to unfriend user" });
  }
});

async function startServer(){
    await connectToMongoDB();

    app.listen(3000,() => {
      console.log("Backend running on port 3000");
    });
}

startServer();
