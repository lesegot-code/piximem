// Student Number: u25143230
import { Router } from "express";
import { getDB } from "../db.js";
import {
  HttpError, toId, includesId, cleanText, parseHashtags, enrichPosts, miniUser,
} from "../lib/helpers.js";
import { canManage } from "../lib/auth.js";
import { deleteAlbum } from "../lib/cascade.js";

const router = Router();

async function findAlbum(db, id)
{
  const _id = toId(id);
  if(!_id) throw new HttpError(400, "That album link isn't valid.");

  const album = await db.collection("albums").findOne({ _id });
  if(!album) throw new HttpError(404, "This album doesn't exist (it may have been deleted).");
  return album;
}

//turns posted ids into ObjectIds of posts that really exist
async function existingPostIds(db, ids)
{
  const list = (Array.isArray(ids) ? ids : []).map(toId).filter(Boolean);
  if(!list.length) return [];

  const posts = await db.collection("posts").find({ _id: { $in: list } }).toArray();
  return list.filter((id) => posts.some((p) => p._id.toString() === id.toString()));
}

function validateFields(body)
{
  const name = cleanText(body.name, 60);
  if(name.length < 2) throw new HttpError(400, "Give your album a name of at least 2 characters.");

  return {
    name,
    description: cleanText(body.description, 300),
    hashtags: parseHashtags(body.hashtags),
  };
}

router.get("/:id", async(req, res) =>
{
  const db = getDB();
  const album = await findAlbum(db, req.params.id);
  const owner = await db.collection("users").findOne({ _id: album.userId });

  const posts = album.posts.length
    ? await db.collection("posts").find({ _id: { $in: album.posts } }).toArray()
    : [];

  //keep the order the posts were added in
  const ordered = album.posts
    .map((id) => posts.find((p) => p._id.toString() === id.toString()))
    .filter(Boolean);

  res.json({
    _id: album._id,
    name: album.name,
    description: album.description,
    hashtags: album.hashtags || [],
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    owner: miniUser(owner),
    canManage: canManage(req.user, album.userId),
    posts: await enrichPosts(db, ordered, req.user),
  });
});

router.post("/", async(req, res) =>
{
  const db = getDB();
  const fields = validateFields(req.body);
  const postIds = await existingPostIds(db, req.body.postIds);

  const album = {
    userId: req.user._id,
    ...fields,
    posts: postIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("albums").insertOne(album);
  album._id = result.insertedId;

  //shows up in the activity feed
  await db.collection("activities").insertOne({
    type: "album_created",
    userId: req.user._id,
    albumId: album._id,
    postIds,
    createdAt: album.createdAt,
  });

  res.status(201).json(album);
});

router.put("/:id", async(req, res) =>
{
  const db = getDB();
  const album = await findAlbum(db, req.params.id);

  if(!canManage(req.user, album.userId)) throw new HttpError(403, "You can only edit your own albums.");

  const fields = validateFields(req.body);
  await db.collection("albums").updateOne(
    { _id: album._id },
    { $set: { ...fields, updatedAt: new Date() } }
  );

  res.json({ ...album, ...fields });
});

//add one or more posts: { postIds: [...] }
router.post("/:id/posts", async(req, res) =>
{
  const db = getDB();
  const album = await findAlbum(db, req.params.id);

  if(!canManage(req.user, album.userId)) throw new HttpError(403, "You can only add to your own albums.");

  const postIds = await existingPostIds(db, req.body.postIds);
  const added = postIds.filter((id) => !includesId(album.posts, id));

  if(!added.length) throw new HttpError(400, "Those photos are already in this album.");

  await db.collection("albums").updateOne(
    { _id: album._id },
    { $push: { posts: { $each: added } }, $set: { updatedAt: new Date() } }
  );

  await db.collection("activities").insertOne({
    type: "album_added",
    userId: req.user._id,
    albumId: album._id,
    postIds: added,
    createdAt: new Date(),
  });

  res.json({ added: added.length });
});

//removing a post from an album never deletes the post itself
router.delete("/:id/posts/:postId", async(req, res) =>
{
  const db = getDB();
  const album = await findAlbum(db, req.params.id);
  const postId = toId(req.params.postId);

  if(!canManage(req.user, album.userId)) throw new HttpError(403, "You can only change your own albums.");
  if(!postId) throw new HttpError(400, "That post link isn't valid.");

  await db.collection("albums").updateOne(
    { _id: album._id },
    { $pull: { posts: postId }, $set: { updatedAt: new Date() } }
  );
  await db.collection("activities").updateMany(
    { albumId: album._id },
    { $pull: { postIds: postId } }
  );

  res.json({ success: true });
});

router.delete("/:id", async(req, res) =>
{
  const db = getDB();
  const album = await findAlbum(db, req.params.id);

  if(!canManage(req.user, album.userId)) throw new HttpError(403, "You can only delete your own albums.");

  await deleteAlbum(db, album._id);
  res.json({ success: true });
});

export default router;
