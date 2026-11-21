// Student Number: u25143230
import { Router } from "express";
import crypto from "node:crypto";
import { getDB } from "../db.js";
import { HttpError, cleanText, selfUser } from "../lib/helpers.js";
import { hashPassword, checkPassword, startSession, endSession, currentUser } from "../lib/auth.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{2,30}$/;

function escapeRegex(text)
{
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

//usernames are unique, ignoring capital letters
export async function usernameTaken(db, username, exceptId = null)
{
  const found = await db.collection("users").findOne({
    username: { $regex: `^${escapeRegex(username)}$`, $options: "i" },
  });
  return Boolean(found && (!exceptId || found._id.toString() !== exceptId.toString()));
}

router.post("/signup", async(req, res) =>
{
  const email = cleanText(req.body.email, 120).toLowerCase();
  const password = String(req.body.password || "");
  const username = cleanText(req.body.username, 30);
  const name = cleanText(req.body.name, 60);

  if(!EMAIL_RE.test(email)) throw new HttpError(400, "Please enter a valid email address.");
  if(password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
  if(!USERNAME_RE.test(username))
  {
    throw new HttpError(400, "Username must be 2-30 characters: letters, numbers, dots or underscores.");
  }

  const db = getDB();
  const users = db.collection("users");

  if(await users.findOne({ email })) throw new HttpError(400, "That email is already registered. Try logging in.");
  if(await usernameTaken(db, username)) throw new HttpError(400, "That username is taken. Try another one.");

  const newUser = {
    email,
    password: hashPassword(password),
    username,
    name: name || username,
    pronouns: "",
    bio: "",
    location: "",
    website: "",
    avatar: null,
    avatarSeed: crypto.randomBytes(8).toString("hex"), //makes the placeholder avatar unique
    friends: [],
    friendRequests: [],
    favourites: [],
    isAdmin: false,
    verified: false,
    verification: null,
    reportingBlocked: false,
    createdAt: new Date(),
  };

  const result = await users.insertOne(newUser);
  newUser._id = result.insertedId;

  //log straight in after signing up
  await startSession(req, res, newUser._id);
  res.status(201).json({ user: selfUser(newUser) });
});

router.post("/login", async(req, res) =>
{
  const email = cleanText(req.body.email, 120).toLowerCase();
  const password = String(req.body.password || "");

  if(!email || !password) throw new HttpError(400, "Enter your email and password.");

  const db = getDB();
  const user = await db.collection("users").findOne({ email });

  if(!user || !checkPassword(password, user.password))
  {
    throw new HttpError(401, "That email and password don't match an account.");
  }

  //old plain text passwords get hashed the first time they log in
  if(!user.password.startsWith("scrypt$"))
  {
    await db.collection("users").updateOne({ _id: user._id }, { $set: { password: hashPassword(password) } });
  }

  await startSession(req, res, user._id);
  res.json({ user: selfUser(user) });
});

router.post("/logout", async(req, res) =>
{
  await endSession(req, res);
  res.json({ success: true });
});

//used on page load to restore the session from the cookie
router.get("/me", async(req, res) =>
{
  const user = await currentUser(req);
  if(!user) return res.json({ user: null });
  res.json({ user: selfUser(user) });
});

export default router;
