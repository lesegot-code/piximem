// Student Number: u25143230
import { Router } from "express";
import { getDB } from "../db.js";
import {
  HttpError, toId, sameId, cleanText, miniUser, usersById, enrichPosts, notify,
} from "../lib/helpers.js";
import { requireAdmin } from "../lib/auth.js";
import { albumCards, verificationProgress } from "./users.js";

const router = Router();
router.use(requireAdmin);

//rules used to flag someone who reports too much (shown on the admin page too)
export const ABUSE_RULES = { minDismissed: 3, dismissedShare: 0.6, perDay: 5 };

function reportStats(log, userId)
{
  const mine = log.filter((r) => sameId(r.userId, userId));
  const dayAgo = Date.now() - 86400000;
  const stats = {
    made: mine.length,
    upheld: mine.filter((r) => r.outcome === "upheld").length,
    dismissed: mine.filter((r) => r.outcome === "dismissed").length,
    open: mine.filter((r) => r.outcome === "open").length,
    lastDay: mine.filter((r) => new Date(r.createdAt).getTime() > dayAgo).length,
  };

  const resolved = stats.upheld + stats.dismissed;
  const reasons = [];
  if(stats.dismissed >= ABUSE_RULES.minDismissed && stats.dismissed / resolved >= ABUSE_RULES.dismissedShare)
  {
    reasons.push(`${stats.dismissed} of ${resolved} reviewed reports were dismissed`);
  }
  if(stats.lastDay >= ABUSE_RULES.perDay)
  {
    reasons.push(`${stats.lastDay} reports in the last 24 hours`);
  }

  return { ...stats, flagged: reasons.length > 0, flagReasons: reasons };
}

router.get("/overview", async(req, res) =>
{
  const db = getDB();
  const [users, posts, albums, reported, pending] = await Promise.all([
    db.collection("users").countDocuments({}),
    db.collection("posts").countDocuments({}),
    db.collection("albums").countDocuments({}),
    db.collection("posts").countDocuments({ "reports.0": { $exists: true } }),
    db.collection("users").countDocuments({ "verification.status": "pending" }),
  ]);
  res.json({ users, posts, albums, reported, pending, rules: ABUSE_RULES });
});

//every reported post with its reasons
router.get("/reports", async(req, res) =>
{
  const db = getDB();
  const posts = await db.collection("posts").find({ "reports.0": { $exists: true } }).toArray();
  posts.sort((a, b) => b.reports.length - a.reports.length);

  const reporters = await usersById(db, posts.flatMap((p) => p.reports.map((r) => r.userId)));
  const enriched = await enrichPosts(db, posts, req.user);

  res.json(enriched.map((p, i) =>
  {
    const reasonCounts = {};
    for(const r of posts[i].reports) reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;

    return {
      ...p,
      reasonCounts,
      reports: posts[i].reports.map((r) => ({
        _id: r._id,
        reason: r.reason,
        createdAt: r.createdAt,
        reporter: miniUser(reporters[r.userId.toString()]),
      })),
    };
  }));
});

//keep the post, clear its reports
router.post("/posts/:id/dismiss", async(req, res) =>
{
  const db = getDB();
  const _id = toId(req.params.id);
  const post = _id ? await db.collection("posts").findOne({ _id }) : null;
  if(!post) throw new HttpError(404, "This post doesn't exist anymore.");

  await db.collection("posts").updateOne({ _id }, { $set: { reports: [] } });
  await db.collection("reports").updateMany(
    { postId: _id, outcome: "open" },
    { $set: { outcome: "dismissed", resolvedAt: new Date() } }
  );

  res.json({ success: true });
});

router.get("/users", async(req, res) =>
{
  const db = getDB();
  const [users, posts, albums, log] = await Promise.all([
    db.collection("users").find({}).toArray(),
    db.collection("posts").find({}).toArray(),
    db.collection("albums").find({}).toArray(),
    db.collection("reports").find({}).toArray(),
  ]);

  users.sort((a, b) => a.username.localeCompare(b.username));

  res.json(users.map((u) => ({
    ...miniUser(u),
    email: u.email,
    pronouns: u.pronouns || "",
    bio: u.bio || "",
    location: u.location || "",
    website: u.website || "",
    createdAt: u.createdAt,
    reportingBlocked: Boolean(u.reportingBlocked),
    postCount: posts.filter((p) => sameId(p.userId, u._id)).length,
    albumCount: albums.filter((a) => sameId(a.userId, u._id)).length,
    reportStats: reportStats(log, u._id),
  })));
});

//pause or allow reporting for someone who abuses it
router.post("/users/:id/reporting", async(req, res) =>
{
  const db = getDB();
  const _id = toId(req.params.id);
  const user = _id ? await db.collection("users").findOne({ _id }) : null;
  if(!user) throw new HttpError(404, "This user doesn't exist anymore.");

  const blocked = Boolean(req.body.blocked);
  await db.collection("users").updateOne({ _id }, { $set: { reportingBlocked: blocked } });

  await notify(
    db,
    _id,
    "reporting",
    blocked
      ? "An admin paused your ability to report posts because many of your reports were not valid."
      : "You can report posts again.",
    null
  );

  res.json({ reportingBlocked: blocked });
});

router.get("/posts", async(req, res) =>
{
  const db = getDB();
  const posts = await db.collection("posts").find({}).toArray();
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(await enrichPosts(db, posts, req.user));
});

router.get("/albums", async(req, res) =>
{
  const db = getDB();
  const albums = await db.collection("albums").find({}).toArray();
  albums.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const owners = await usersById(db, albums.map((a) => a.userId));
  const cards = await albumCards(db, albums);
  res.json(cards.map((c) => ({ ...c, owner: miniUser(owners[c.userId.toString()]) })));
});

//report reasons (users pick from these)
router.post("/reasons", async(req, res) =>
{
  const db = getDB();
  const label = cleanText(req.body.label, 60);
  if(label.length < 3) throw new HttpError(400, "A reason needs at least 3 characters.");

  const all = await db.collection("reasons").find({}).toArray();
  if(all.some((r) => r.label.toLowerCase() === label.toLowerCase()))
  {
    throw new HttpError(400, "That reason already exists.");
  }

  const reason = { label, createdAt: new Date() };
  const result = await db.collection("reasons").insertOne(reason);
  res.status(201).json({ _id: result.insertedId, ...reason });
});

router.delete("/reasons/:id", async(req, res) =>
{
  const db = getDB();
  const _id = toId(req.params.id);
  const count = await db.collection("reasons").countDocuments({});
  if(count <= 1) throw new HttpError(400, "Keep at least one reason so users can still report posts.");

  if(_id) await db.collection("reasons").deleteOne({ _id });
  res.json({ success: true });
});

router.get("/verifications", async(req, res) =>
{
  const db = getDB();
  const users = await db.collection("users").find({ "verification.status": "pending" }).toArray();

  const list = [];
  for(const u of users)
  {
    list.push({
      user: { ...miniUser(u), email: u.email, createdAt: u.createdAt },
      requestedAt: u.verification.requestedAt,
      progress: await verificationProgress(db, u),
    });
  }
  res.json(list);
});

router.post("/verifications/:id", async(req, res) =>
{
  const db = getDB();
  const _id = toId(req.params.id);
  const user = _id ? await db.collection("users").findOne({ _id }) : null;
  if(!user) throw new HttpError(404, "This user doesn't exist anymore.");

  const approve = Boolean(req.body.approve);
  await db.collection("users").updateOne({ _id }, {
    $set: {
      verified: approve,
      verification: { ...user.verification, status: approve ? "approved" : "denied", reviewedAt: new Date() },
    },
  });

  await notify(
    db,
    _id,
    "verification",
    approve ? "Your account is now verified." : "Your verification request was not approved this time.",
    `/profile/${_id}`
  );

  res.json({ verified: approve });
});

export default router;
