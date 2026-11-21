// Student Number: u25143230
import { Router } from "express";
import { getDB } from "../db.js";
import { includesId, enrichPosts, usersById, miniUser, parseHashtags } from "../lib/helpers.js";

const router = Router();

const RANGES = { day: 1, week: 7, month: 30 };
const PAGE_SIZE = 10;

//GET /api/feed?scope=local|global&sort=newest|commented&range=all|day|week|month&tag=%23x&page=1
router.get("/", async(req, res) =>
{
  const db = getDB();
  const me = req.user;
  const scope = req.query.scope === "global" ? "global" : "local";
  const sort = req.query.sort === "commented" ? "commented" : "newest";
  const days = RANGES[req.query.range] || null;
  const tag = parseHashtags(req.query.tag || "")[0] || null;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  //local = me + my friends, global = everyone
  const authorFilter = scope === "local" ? { userId: { $in: [me._id, ...(me.friends || [])] } } : {};
  const since = days ? new Date(Date.now() - days * 86400000) : null;
  const inRange = (item) => !since || new Date(item.createdAt) >= since;

  const posts = await db.collection("posts").find(authorFilter).toArray();
  const activities = await db.collection("activities").find(authorFilter).toArray();

  const albumIds = activities.map((a) => a.albumId);
  const albums = albumIds.length
    ? await db.collection("albums").find({ _id: { $in: albumIds } }).toArray()
    : [];
  const albumById = {};
  for(const a of albums) albumById[a._id.toString()] = a;

  //album activity can show photos from any user, so look those up too
  const extraIds = activities.flatMap((a) => a.postIds || []);
  const extraPosts = extraIds.length
    ? await db.collection("posts").find({ _id: { $in: extraIds } }).toArray()
    : [];
  const postById = {};
  for(const p of [...posts, ...extraPosts]) postById[p._id.toString()] = p;

  let items = [];

  for(const p of posts)
  {
    if(!inRange(p)) continue;
    if(tag && !(p.hashtags || []).includes(tag)) continue;
    items.push({ type: "post", createdAt: p.createdAt, userId: p.userId, postIds: [p._id], score: (p.comments || []).length });
  }

  for(const a of activities)
  {
    const album = albumById[a.albumId.toString()];
    if(!album || !inRange(a)) continue;

    //only photos that are still in the album
    const ids = (a.postIds || []).filter((id) => includesId(album.posts, id) && postById[id.toString()]);
    if(a.type === "album_added" && !ids.length) continue;

    if(tag)
    {
      const albumTags = [...(album.hashtags || []), ...ids.flatMap((id) => postById[id.toString()].hashtags || [])];
      if(!albumTags.includes(tag)) continue;
    }

    const score = ids.reduce((sum, id) => sum + (postById[id.toString()].comments || []).length, 0);
    items.push({ type: a.type, createdAt: a.createdAt, userId: a.userId, postIds: ids, album, score });
  }

  //sort, then pull favourite friends to the top (keeping the chosen order)
  items.sort((a, b) =>
  {
    if(sort === "commented" && b.score !== a.score) return b.score - a.score;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  for(const item of items) item.favourite = includesId(me.favourites, item.userId);
  items = [...items.filter((i) => i.favourite), ...items.filter((i) => !i.favourite)];

  const total = items.length;
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  //only now load the full details for the items on this page
  const needed = pageItems.flatMap((i) => i.postIds.slice(0, 4).map((id) => postById[id.toString()]));
  const enriched = await enrichPosts(db, needed, me);
  const enrichedById = {};
  for(const p of enriched) enrichedById[p._id.toString()] = p;

  const authors = await usersById(db, pageItems.map((i) => i.userId));

  res.json({
    items: pageItems.map((i) => ({
      type: i.type,
      createdAt: i.createdAt,
      favourite: i.favourite,
      user: miniUser(authors[i.userId.toString()]),
      post: i.type === "post" ? enrichedById[i.postIds[0].toString()] : undefined,
      album: i.album
        ? {
          _id: i.album._id,
          name: i.album.name,
          description: i.album.description,
          hashtags: i.album.hashtags || [],
          postCount: i.album.posts.length,
        }
        : undefined,
      photos: i.type !== "post" ? i.postIds.slice(0, 4).map((id) => enrichedById[id.toString()]) : undefined,
      photoCount: i.postIds.length,
    })),
    hasMore: page * PAGE_SIZE < total,
    total,
  });
});

//most used hashtags (for the sidebar and the filter)
router.get("/hashtags", async(req, res) =>
{
  const posts = await getDB().collection("posts").find({}).toArray();
  const counts = {};

  for(const p of posts)
  {
    for(const t of p.hashtags || []) counts[t] = (counts[t] || 0) + 1;
  }

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  res.json(top);
});

export default router;
