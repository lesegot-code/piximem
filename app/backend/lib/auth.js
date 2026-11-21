// Student Number: u25143230
import crypto from "node:crypto";
import { getDB } from "../db.js";
import { HttpError } from "./helpers.js";

const COOKIE_NAME = "pm_session";
const SESSION_DAYS = 7;

//passwords are stored as "scrypt$salt$hash"
export function hashPassword(password)
{
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function checkPassword(password, stored)
{
  if(!stored) return false;

  //older accounts were saved as plain text
  if(!stored.startsWith("scrypt$")) return password === stored;

  const [, salt, hash] = stored.split("$");
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, "hex"));
}

function readCookie(req, name)
{
  const header = req.headers.cookie || "";
  for(const part of header.split(";"))
  {
    const [key, ...rest] = part.trim().split("=");
    if(key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

//creates a session row and sends the cookie
export async function startSession(req, res, userId)
{
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await getDB().collection("sessions").insertOne({
    token,
    userId,
    createdAt: new Date(),
    expiresAt,
  });

  //httpOnly: javascript in the page can't read it
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export async function endSession(req, res)
{
  const token = readCookie(req, COOKIE_NAME);
  if(token) await getDB().collection("sessions").deleteOne({ token });
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

//finds the logged in user from the cookie (or null)
export async function currentUser(req)
{
  const token = readCookie(req, COOKIE_NAME);
  if(!token) return null;

  const db = getDB();
  const session = await db.collection("sessions").findOne({ token });
  if(!session) return null;

  if(new Date(session.expiresAt) < new Date())
  {
    await db.collection("sessions").deleteOne({ token });
    return null;
  }

  return db.collection("users").findOne({ _id: session.userId });
}

export async function requireAuth(req, res, next)
{
  const user = await currentUser(req);
  if(!user) throw new HttpError(401, "Please log in to continue.");

  req.user = user;
  next();
}

export function requireAdmin(req, res, next)
{
  if(!req.user?.isAdmin) throw new HttpError(403, "Only admins can do that.");
  next();
}

//owner of something, or an admin
export function canManage(user, ownerId)
{
  return Boolean(user && (user.isAdmin || user._id.toString() === ownerId?.toString()));
}
