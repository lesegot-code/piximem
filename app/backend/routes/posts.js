// Student Number: u25143230
import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../db.js";
import {
  HttpError, toId, sameId, includesId, cleanText, parseHashtags, enrichPosts, notify,
} from "../lib/helpers.js";
import { canManage } from "../lib/auth.js";
import { upload, storeUpload, discardUpload } from "../lib/upload.js";
import { deletePost } from "../lib/cascade.js";

const router = Router();

async function findPost(db, id)
{
  const _id = toId(id);
  if(!_id) throw new HttpError(400, "That post link isn't valid.");

  const post = await db.collection("posts").findOne({ _id });
  if(!post) throw new HttpError(404, "This post doesn't exist (it may have been deleted).");
  return post;
}

//one post with its albums and what the viewer is allowed to do
router.get("/:id", async(req, res) =>
{
  const db = getDB();
  const post = await findPost(db, req.params.id);
  const [enriched] = await enrichPosts(db, [post], req.user);

  const albums = await db.collection("albums").find({ posts: post._id }).toArray();

  res.json({
    ...enriched,
    canManage: canManage(req.user, post.userId),
    albums: albums.map((a) => ({ _id: a._id, name: a.name, userId: a.userId })),
  });
});

//new post: multipart so the image and the fields arrive together
router.post("/", upload.single("image"), async(req, res) =>
{
  const caption = cleanText(req.body.caption, 500);

  if(!req.file) throw new HttpError(400, "Please add a photo to your post.");
  if(caption.length < 3)
  {
    discardUpload(req.file);
    throw new HttpError(400, "Write a caption of at least 3 characters.");
  }

  const db = getDB();
  const newPost = {
    userId: req.user._id,
    caption,
    hashtags: parseHashtags(req.body.hashtags),
    image: await storeUpload(req.file),
    comments: [],
    reports: [],
    createdAt: new Date(), //set by the server, never by the user
  };

  const result = await db.collection("posts").insertOne(newPost);
  newPost._id = result.insertedId;

  const [enriched] = await enrichPosts(db, [newPost], req.user);
  res.status(201).json(enriched);
});

//caption and hashtags can change, the image can't
router.put("/:id", async(req, res) =>
{
  const db = getDB();
  const post = await findPost(db, req.params.id);

  if(!canManage(req.user, post.userId)) throw new HttpError(403, "You can only edit your own posts.");

  const caption = cleanText(req.body.caption, 500);
  if(caption.length < 3) throw new HttpError(400, "Write a caption of at least 3 characters.");

  await db.collection("posts").updateOne(
    { _id: post._id },
    { $set: { caption, hashtags: parseHashtags(req.body.hashtags) } }
  );

  const fresh = await db.collection("posts").findOne({ _id: post._id });
  const [enriched] = await enrichPosts(db, [fresh], req.user);
  res.json(enriched);
});

router.delete("/:id", async(req, res) =>
{
  const db = getDB();
  const post = await findPost(db, req.params.id);
  const me = req.user;

  if(!canManage(me, post.userId)) throw new HttpError(403, "You can only delete your own posts.");

  const byAdmin = me.isAdmin && !sameId(me._id, post.userId);
  const albumsRemoved = await deletePost(db, post, byAdmin ? "upheld" : "post_deleted");

  //let the owner know when a moderator removed their post
  if(byAdmin)
  {
    const reason = cleanText(req.body?.reason, 200);
    const short = post.caption.length > 40 ? `${post.caption.slice(0, 40)}…` : post.caption;
    await notify(
      db,
      post.userId,
      "post_removed",
      `An admin removed your post "${short}"${reason ? `. Reason: ${reason}` : "."}`,
      null
    );
  }

  res.json({ success: true, albumsRemoved });
});

router.post("/:id/comments", async(req, res) =>
{
  const db = getDB();
  const post = await findPost(db, req.params.id);
  const text = cleanText(req.body.text, 300);

  if(!text) throw new HttpError(400, "Write something before posting your comment.");

  const comment = {
    _id: new ObjectId(),
    userId: req.user._id,
    text,
    createdAt: new Date(),
  };

  await db.collection("posts").updateOne({ _id: post._id }, { $push: { comments: comment } });

  const fresh = await db.collection("posts").findOne({ _id: post._id });
  const [enriched] = await enrichPosts(db, [fresh], req.user);
  res.status(201).json(enriched);
});

//comment author, post owner or an admin can remove a comment
router.delete("/:id/comments/:commentId", async(req, res) =>
{
  const db = getDB();
  const post = await findPost(db, req.params.id);
  const comment = (post.comments || []).find((c) => sameId(c._id, req.params.commentId));

  if(!comment) throw new HttpError(404, "That comment was already removed.");

  const allowed = req.user.isAdmin || sameId(comment.userId, req.user._id) || sameId(post.userId, req.user._id);
  if(!allowed) throw new HttpError(403, "You can't remove this comment.");

  await db.collection("posts").updateOne({ _id: post._id }, { $pull: { comments: { _id: comment._id } } });

  const fresh = await db.collection("posts").findOne({ _id: post._id });
  const [enriched] = await enrichPosts(db, [fresh], req.user);
  res.json(enriched);
});

router.post("/:id/report", async(req, res) =>
{
  const db = getDB();
  const me = req.user;
  const post = await findPost(db, req.params.id);

  if(me.reportingBlocked) throw new HttpError(403, "An admin has paused reporting on your account.");
  if(sameId(post.userId, me._id)) throw new HttpError(400, "You can't report your own post.");
  if(includesId((post.reports || []).map((r) => r.userId), me._id))
  {
    throw new HttpError(400, "You have already reported this post.");
  }

  //only reasons created by admins can be used
  const reasonId = toId(req.body.reasonId);
  const reason = reasonId ? await db.collection("reasons").findOne({ _id: reasonId }) : null;
  if(!reason) throw new HttpError(400, "Please choose a reason from the list.");

  const report = { _id: new ObjectId(), userId: me._id, reason: reason.label, createdAt: new Date() };
  await db.collection("posts").updateOne({ _id: post._id }, { $push: { reports: report } });

  //the report log is what admins use to spot abuse
  await db.collection("reports").insertOne({
    userId: me._id,
    postId: post._id,
    postOwnerId: post.userId,
    reason: reason.label,
    outcome: "open",
    createdAt: report.createdAt,
  });

  res.status(201).json({ success: true, reportCount: (post.reports || []).length + 1 });
});

export default router;
