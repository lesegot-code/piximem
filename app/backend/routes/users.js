// Student Number: u25143230
import { Router } from "express";
import crypto from "node:crypto";
import { getDB } from "../db.js";
import {
  HttpError, toId, sameId, includesId, cleanText,
  miniUser, publicUser, selfUser, usersById, enrichPosts, imageUrl,
} from "../lib/helpers.js";
import { canManage } from "../lib/auth.js";
import { upload, storeUpload, discardUpload, removeUpload } from "../lib/upload.js";
import { deleteUser } from "../lib/cascade.js";
import { usernameTaken } from "./auth.js";

const router = Router();

const VERIFY_RULES = { days: 7, posts: 2, comments: 5 };

async function findUser(db, id)
{
  const _id = toId(id);
  if(!_id) throw new HttpError(400, "That user link isn't valid.");

  const user = await db.collection("users").findOne({ _id });
  if(!user) throw new HttpError(404, "This user doesn't exist (the account may have been deleted).");
  return user;
}

export function friendshipStatus(me, other)
{
  if(sameId(me._id, other._id)) return "self";
  if(includesId(me.friends, other._id)) return "friends";
  if(includesId(other.friendRequests, me._id)) return "request-sent";
  if(includesId(me.friendRequests, other._id)) return "request-received";
  return "none";
}

//who may request verification and how far they are
export async function verificationProgress(db, user)
{
  const posts = await db.collection("posts").countDocuments({ userId: user._id });
  const commented = await db.collection("posts").find({ "comments.userId": user._id }).toArray();
  const comments = commented.reduce(
    (sum, p) => sum + p.comments.filter((c) => sameId(c.userId, user._id)).length, 0
  );
  const days = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);

  return {
    days,
    posts,
    comments,
    rules: VERIFY_RULES,
    eligible: days >= VERIFY_RULES.days && posts >= VERIFY_RULES.posts && comments >= VERIFY_RULES.comments,
  };
}

//everything the profile page needs in one request
router.get("/:id/profile", async(req, res) =>
{
  const db = getDB();
  const me = req.user;
  const user = await findUser(db, req.params.id);
  const status = friendshipStatus(me, user);

  //non friends only get the name and picture
  const canSeeFull = status === "self" || status === "friends" || me.isAdmin;

  const result = {
    user: status === "self" ? selfUser(user) : (canSeeFull ? publicUser(user) : miniUser(user)),
    friendship: status,
    canSeeFull,
    isFavourite: includesId(me.favourites, user._id),
  };

  if(canSeeFull)
  {
    const posts = await db.collection("posts").find({ userId: user._id }).toArray();
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    result.posts = await enrichPosts(db, posts, me);

    const albums = await db.collection("albums").find({ userId: user._id }).toArray();
    albums.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    result.albums = await albumCards(db, albums);

    const map = await usersById(db, user.friends || []);
    result.friends = (user.friends || []).map((id) => miniUser(map[id.toString()])).filter(Boolean);
  }

  if(status === "self")
  {
    const map = await usersById(db, user.friendRequests || []);
    result.requests = (user.friendRequests || []).map((id) => miniUser(map[id.toString()])).filter(Boolean);
    result.verification = await verificationProgress(db, user);
  }

  res.json(result);
});

//albums with up to 3 cover images
export async function albumCards(db, albums)
{
  const postIds = albums.flatMap((a) => a.posts || []);
  const posts = postIds.length
    ? await db.collection("posts").find({ _id: { $in: postIds } }).toArray()
    : [];
  const byId = {};
  for(const p of posts) byId[p._id.toString()] = p;

  return albums.map((a) =>
  {
    const inAlbum = (a.posts || []).map((id) => byId[id.toString()]).filter(Boolean);
    return {
      _id: a._id,
      userId: a.userId,
      name: a.name,
      description: a.description,
      hashtags: a.hashtags || [],
      postCount: inAlbum.length,
      postIds: inAlbum.map((p) => p._id),
      covers: inAlbum.slice(0, 3).map((p) => imageUrl(p.image)),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  });
}

//edit profile (own account, or any account for admins). multipart so an avatar can be uploaded
router.put("/:id", upload.single("avatar"), async(req, res) =>
{
  try
  {
    await updateProfile(req, res);
  }
  catch(err)
  {
    discardUpload(req.file); //don't keep a photo from a form that failed
    throw err;
  }
});

async function updateProfile(req, res)
{
  const db = getDB();
  const user = await findUser(db, req.params.id);

  if(!canManage(req.user, user._id)) throw new HttpError(403, "You can only edit your own profile.");

  const updates = {};
  const body = req.body;

  if(body.username !== undefined)
  {
    const username = cleanText(body.username, 30);
    if(!/^[a-zA-Z0-9_.]{2,30}$/.test(username))
    {
      throw new HttpError(400, "Username must be 2-30 characters: letters, numbers, dots or underscores.");
    }
    if(await usernameTaken(db, username, user._id)) throw new HttpError(400, "That username is taken.");
    updates.username = username;
  }

  if(body.name !== undefined) updates.name = cleanText(body.name, 60);
  if(body.pronouns !== undefined) updates.pronouns = cleanText(body.pronouns, 30);
  if(body.bio !== undefined) updates.bio = cleanText(body.bio, 200);
  if(body.location !== undefined) updates.location = cleanText(body.location, 60);

  if(body.website !== undefined)
  {
    let website = cleanText(body.website, 200);
    if(website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if(website)
    {
      try { new URL(website); }
      catch { throw new HttpError(400, "That website link doesn't look right."); }
    }
    updates.website = website;
  }

  //"shuffle" gives a brand new generated avatar
  if(body.shuffleAvatar === "true" || body.shuffleAvatar === true)
  {
    updates.avatarSeed = crypto.randomBytes(8).toString("hex");
  }

  if(body.removeAvatar === "true" || body.removeAvatar === true)
  {
    removeUpload(user.avatar);
    updates.avatar = null;
  }

  if(req.file)
  {
    updates.avatar = await storeUpload(req.file);
    removeUpload(user.avatar);
  }

  //only admins can verify accounts from here
  if(req.user.isAdmin && body.verified !== undefined)
  {
    updates.verified = body.verified === true || body.verified === "true";
  }

  await db.collection("users").updateOne({ _id: user._id }, { $set: updates });
  const fresh = await db.collection("users").findOne({ _id: user._id });

  res.json({ user: sameId(fresh._id, req.user._id) ? selfUser(fresh) : publicUser(fresh) });
}

router.delete("/:id", async(req, res) =>
{
  const db = getDB();
  const user = await findUser(db, req.params.id);

  if(!canManage(req.user, user._id)) throw new HttpError(403, "You can only delete your own account.");

  await deleteUser(db, user);

  //deleting yourself logs you out
  if(sameId(user._id, req.user._id)) res.clearCookie("pm_session", { path: "/" });

  res.json({ success: true });
});

//favourite friends show first in the feed
router.post("/:id/favourite", async(req, res) =>
{
  const db = getDB();
  const user = await findUser(db, req.params.id);
  const me = req.user;

  if(!includesId(me.friends, user._id)) throw new HttpError(400, "You can only favourite your friends.");

  const isFavourite = includesId(me.favourites, user._id);
  await db.collection("users").updateOne(
    { _id: me._id },
    isFavourite ? { $pull: { favourites: user._id } } : { $addToSet: { favourites: user._id } }
  );

  res.json({ isFavourite: !isFavourite });
});

router.post("/me/verification", async(req, res) =>
{
  const db = getDB();
  const me = req.user;

  if(me.isAdmin) throw new HttpError(400, "Admin accounts don't need verification.");
  if(me.verified) throw new HttpError(400, "Your account is already verified.");
  if(me.verification?.status === "pending") throw new HttpError(400, "Your request is already waiting for an admin.");

  const progress = await verificationProgress(db, me);
  if(!progress.eligible)
  {
    throw new HttpError(400, `You need an account older than ${VERIFY_RULES.days} days, ${VERIFY_RULES.posts} posts and ${VERIFY_RULES.comments} comments.`);
  }

  const verification = { status: "pending", requestedAt: new Date() };
  await db.collection("users").updateOne({ _id: me._id }, { $set: { verification } });
  res.json({ verification });
});

//people you may know: not friends yet, most mutual friends first
router.get("/me/suggestions", async(req, res) =>
{
  const db = getDB();
  const me = req.user;
  const users = await db.collection("users").find({}).toArray();

  const list = users
    .filter((u) => !sameId(u._id, me._id) && !includesId(me.friends, u._id) && !u.isAdmin)
    .map((u) => ({
      user: miniUser(u),
      mutual: (u.friends || []).filter((id) => includesId(me.friends, id)).length,
      requested: includesId(u.friendRequests, me._id),
      wantsYou: includesId(me.friendRequests, u._id),
    }))
    .sort((a, b) => b.wantsYou - a.wantsYou || b.mutual - a.mutual || a.user.username.localeCompare(b.user.username))
    .slice(0, 5);

  res.json(list);
});

//my own albums (for the "save to album" picker)
router.get("/me/albums", async(req, res) =>
{
  const db = getDB();
  const albums = await db.collection("albums").find({ userId: req.user._id }).toArray();
  albums.sort((a, b) => a.name.localeCompare(b.name));
  res.json(await albumCards(db, albums));
});

export default router;
