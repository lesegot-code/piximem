// Student Number: u25143230
import { Router } from "express";
import { getDB } from "../db.js";
import { HttpError, cleanText, enrichPosts, miniUser } from "../lib/helpers.js";
import { scoreFields, scoreText, rank } from "../lib/search.js";
import { albumCards } from "./users.js";

const router = Router();

//a fuzzy match on a hashtag list ("#wildlfe" still finds "#wildlife")
function tagScore(query, tags)
{
  const q = query.replace(/^#/, "");
  let best = 0;
  for(const t of tags || []) best = Math.max(best, scoreText(q, t.replace(/^#/, "")));
  return best;
}

async function runSearch(db, raw, limit)
{
  const query = cleanText(raw, 80);
  if(!query) throw new HttpError(400, "Type something to search for.");

  const isTag = query.startsWith("#");
  const [users, posts, albums] = await Promise.all([
    db.collection("users").find({}).toArray(),
    db.collection("posts").find({}).toArray(),
    db.collection("albums").find({}).toArray(),
  ]);

  //"#tag" searches only hashtags, anything else searches text and hashtags
  const foundUsers = isTag ? [] : rank(users, (u) => scoreFields(query, [
    [u.username, 1.2],
    [u.name, 1.1],
    [u.email, 1],
  ]), limit);

  const foundPosts = rank(posts, (p) => isTag
    ? tagScore(query, p.hashtags)
    : Math.max(scoreFields(query, [[p.caption, 1]]), tagScore(query, p.hashtags) * 0.9), limit);

  const foundAlbums = rank(albums, (a) => isTag
    ? tagScore(query, a.hashtags)
    : Math.max(
      scoreFields(query, [[a.name, 1.2], [a.description, 1]]),
      tagScore(query, a.hashtags) * 0.9
    ), limit);

  return { query, users: foundUsers, posts: foundPosts, albums: foundAlbums, allPosts: posts };
}

//full results for the search page
router.get("/", async(req, res) =>
{
  const db = getDB();
  const found = await runSearch(db, req.query.q, 30);

  res.json({
    query: found.query,
    users: found.users.map(miniUser),
    posts: await enrichPosts(db, found.posts, req.user),
    albums: await albumCards(db, found.albums),
  });
});

//quick suggestions while typing
router.get("/suggest", async(req, res) =>
{
  const db = getDB();
  const query = cleanText(req.query.q, 80);
  if(query.replace("#", "").length < 2) return res.json([]);

  const found = await runSearch(db, query, 4);

  //hashtags that match what was typed
  const tags = new Set();
  for(const p of found.allPosts) for(const t of p.hashtags || []) tags.add(t);
  const matchingTags = rank([...tags], (t) => scoreText(query.replace(/^#/, ""), t.replace(/^#/, "")), 3);

  const suggestions = [
    ...found.users.map((u) => ({ type: "user", label: u.username, sub: u.name || "", link: `/profile/${u._id}`, user: miniUser(u) })),
    ...matchingTags.map((t) => ({ type: "hashtag", label: t, sub: "Hashtag", link: `/search?q=${encodeURIComponent(t)}` })),
    ...found.albums.map((a) => ({ type: "album", label: a.name, sub: "Album", link: `/album/${a._id}` })),
    ...found.posts.map((p) => ({
      type: "post",
      label: p.caption.length > 50 ? `${p.caption.slice(0, 50)}…` : p.caption,
      sub: "Post",
      link: `/post/${p._id}`,
    })),
  ];

  res.json(suggestions.slice(0, 10));
});

export default router;
