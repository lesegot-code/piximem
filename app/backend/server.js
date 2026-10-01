// Student number: 25143230
import { ObjectId } from "mongodb";
import express from "express";
import { getDB } from "./db.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ success: "Test succeeded" });
});

app.post("/api/signup", async(req, res) => {
  try{
    const{ email, password, username } = req.body;
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
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/login", async(req, res) =>{
  try{
    const{ email, password } = req.body;
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
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { username, bio } = req.body;
    const db = getDB();
    const users = db.collection("users");

    const result = await users.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { username, bio } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const db = getDB();
    const users = db.collection("users");

    const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.listen(3000, () => console.log("Backend running on port 3000"));