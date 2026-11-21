// Student Number: u25143230
import { ObjectId } from "mongodb";

export function isValidId(id)
{
  return typeof id === "string" && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

//turns a string id into an ObjectId (null if invalid)
export function toId(id)
{
  if(id instanceof ObjectId) return id;
  return isValidId(id) ? new ObjectId(id) : null;
}

export function sameId(a, b)
{
  return a != null && b != null && a.toString() === b.toString();
}

export function includesId(list, id)
{
  return (list || []).some((x) => sameId(x, id));
}

//express 5 passes rejected promises to the error handler, this adds a clean status
export class HttpError extends Error
{
  constructor(status, message)
  {
    super(message);
    this.status = status;
  }
}

//uploaded files are served from /uploads
export function imageUrl(filename)
{
  if(!filename) return null;
  if(filename.startsWith("http")) return filename;
  return `/uploads/${filename}`;
}

//accepts ["#a","b"], "#a, b c" or a JSON string, returns unique "#tags"
export function parseHashtags(input)
{
  let list = input;

  if(typeof input === "string")
  {
    try
    {
      list = JSON.parse(input);
    }
    catch
    {
      list = input.split(/[\s,]+/);
    }
  }

  if(!Array.isArray(list)) return [];

  const tags = list
    .map((t) => String(t).trim().toLowerCase().replace(/^#+/, ""))
    .map((t) => t.replace(/[^a-z0-9_]/g, ""))
    .filter(Boolean)
    .slice(0, 15)
    .map((t) => `#${t}`);

  return [...new Set(tags)];
}

export function cleanText(value, max)
{
  return String(value ?? "").trim().slice(0, max);
}

//small public card for a user (used next to posts, comments, lists)
export function miniUser(u)
{
  if(!u) return null;
  return {
    _id: u._id,
    username: u.username,
    name: u.name || "",
    avatar: imageUrl(u.avatar),
    avatarSeed: u.avatarSeed || u.username,
    verified: Boolean(u.verified),
    isAdmin: Boolean(u.isAdmin),
  };
}

//everything about a user that is safe to show on their profile
export function publicUser(u)
{
  return {
    ...miniUser(u),
    pronouns: u.pronouns || "",
    bio: u.bio || "",
    location: u.location || "",
    website: u.website || "",
    createdAt: u.createdAt,
  };
}

//the logged in user's own data (adds private fields)
export function selfUser(u)
{
  return {
    ...publicUser(u),
    email: u.email,
    friends: u.friends || [],
    friendRequests: u.friendRequests || [],
    favourites: u.favourites || [],
    verification: u.verification || null,
    reportingBlocked: Boolean(u.reportingBlocked),
  };
}

//loads users by id once and returns a lookup map
export async function usersById(db, ids)
{
  const unique = [...new Set(ids.filter(Boolean).map(String))].map((id) => new ObjectId(id));
  if(!unique.length) return {};

  const users = await db.collection("users").find({ _id: { $in: unique } }).toArray();
  const map = {};
  for(const u of users) map[u._id.toString()] = u;
  return map;
}

export const HIDE_AFTER_REPORTS = 2;

//adds author, comment authors and report info to posts for the client
export async function enrichPosts(db, posts, viewer)
{
  const ids = [];
  for(const p of posts)
  {
    ids.push(p.userId);
    for(const c of p.comments || []) ids.push(c.userId);
  }
  const map = await usersById(db, ids);

  return posts.map((p) =>
  {
    const reports = p.reports || [];
    return {
      _id: p._id,
      userId: p.userId,
      caption: p.caption,
      hashtags: p.hashtags || [],
      imageUrl: imageUrl(p.image),
      createdAt: p.createdAt,
      author: miniUser(map[p.userId?.toString()]),
      comments: (p.comments || []).map((c) => ({
        _id: c._id,
        text: c.text,
        createdAt: c.createdAt,
        author: miniUser(map[c.userId?.toString()]) || { username: "Deleted user" },
      })),
      commentCount: (p.comments || []).length,
      reportCount: reports.length,
      hidden: reports.length > HIDE_AFTER_REPORTS,
      hasReported: viewer ? includesId(reports.map((r) => r.userId), viewer._id) : false,
      isOwner: viewer ? sameId(p.userId, viewer._id) : false,
    };
  });
}

//notifications show up under the bell in the navbar
export async function notify(db, userId, type, message, link = null)
{
  await db.collection("notifications").insertOne({
    userId,
    type,
    message,
    link,
    read: false,
    createdAt: new Date(),
  });
}
