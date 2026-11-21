// Student Number: u25143230
//runs the real app against a real MongoDB: MONGODB_URI=... MONGODB_DB=piximem_test npm run test:api
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ObjectId } from "mongodb";
import app from "../app.js";
import { connectToMongoDB, getDB, disconnectFromMongoDB } from "../db.js";
import { seedDatabase } from "../scripts/seed-data.js";

const PHOTO = fs.readFileSync(path.join(import.meta.dirname, "..", "seed-images", "Lion1.jpg"));
let server;
let base;

//a tiny browser: remembers the session cookie between requests
function client()
{
  let cookie = "";

  async function call(method, url, { json, form } = {})
  {
    const headers = cookie ? { cookie } : {};
    let body;
    if(json !== undefined)
    {
      headers["content-type"] = "application/json";
      body = JSON.stringify(json);
    }
    if(form) body = form;

    const res = await fetch(`${base}/api${url}`, { method, headers, body });
    const setCookie = res.headers.get("set-cookie");
    if(setCookie) cookie = setCookie.split(";")[0];

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  return {
    get: (url) => call("GET", url),
    post: (url, json) => call("POST", url, { json }),
    put: (url, json) => call("PUT", url, { json }),
    del: (url, json) => call("DELETE", url, { json }),
    upload: (method, url, fields, file) =>
    {
      const form = new FormData();
      for(const [k, v] of Object.entries(fields)) form.append(k, v);
      if(file) form.append(file.field, new Blob([file.data], { type: file.type }), file.name);
      return call(method, url, { form });
    },
    async login(email)
    {
      const r = await call("POST", "/auth/login", { json: { email, password: "test1234" } });
      assert.equal(r.status, 200, `login failed for ${email}`);
      return r.data.user;
    },
  };
}

async function userIds()
{
  const users = await getDB().collection("users").find({}).toArray();
  return Object.fromEntries(users.map((u) => [u.username, u._id.toString()]));
}

const skip = !process.env.MONGODB_URI && "set MONGODB_URI (and MONGODB_DB) to run the API tests";

describe("API", { skip }, () =>
{
  before(async() =>
  {
    if(!process.env.MONGODB_DB) throw new Error("Set MONGODB_DB to a test database, the tests wipe it.");
    await connectToMongoDB();
    await seedDatabase(getDB(), { quiet: true });
    server = app.listen(0);
    base = `http://localhost:${server.address().port}`;
  });

  after(async() =>
  {
    server?.close();
    await disconnectFromMongoDB();
  });

  test("health check reports the database", async() =>
  {
    const r = await client().get("/health");
    assert.equal(r.status, 200);
    assert.equal(r.data.database, "connected");
  });

  test("logged out visitors can't use the API", async() =>
  {
    const anon = client();
    assert.equal((await anon.get("/feed")).status, 401);
    assert.equal((await anon.get("/auth/me")).data.user, null);
    assert.equal((await anon.post("/auth/login", { email: "test@test.com", password: "nope" })).status, 401);
  });

  test("login keeps a session and never returns the password", async() =>
  {
    const c = client();
    await c.login("test@test.com");
    const me = await c.get("/auth/me");
    assert.equal(me.data.user.username, "lesego");
    assert.ok(!JSON.stringify(me.data).includes("scrypt$"));

    await c.post("/auth/logout");
    assert.equal((await c.get("/feed")).status, 401);
  });

  test("signup validates, logs in and rejects duplicates", async() =>
  {
    const c = client();
    assert.equal((await c.post("/auth/signup", { email: "bad", password: "secret1", username: "x1" })).status, 400);

    const r = await c.post("/auth/signup", { email: "New@Test.com", password: "secret1", username: "newbie" });
    assert.equal(r.status, 201);
    assert.equal((await c.get("/auth/me")).data.user.email, "new@test.com");
    assert.equal((await client().post("/auth/signup", { email: "new@test.com", password: "secret1", username: "other" })).status, 400);
    assert.equal((await client().post("/auth/signup", { email: "x@test.com", password: "secret1", username: "NEWBIE" })).status, 400);
  });

  test("feed: friends vs everyone, favourites first, album activity, combined filters", async() =>
  {
    const c = client();
    await c.login("test@test.com");

    const local = (await c.get("/feed")).data;
    const global = (await c.get("/feed?scope=global")).data;
    assert.ok(global.total > local.total);
    assert.ok(local.items[0].favourite);
    assert.ok(global.items.some((i) => i.type === "album_added"));

    const filtered = (await c.get("/feed?scope=global&sort=commented&range=week&tag=%23wildlife")).data;
    assert.ok(filtered.total > 0);
    for(const item of filtered.items)
    {
      const tags = item.post ? item.post.hashtags : [...item.album.hashtags, ...item.photos.flatMap((p) => p.hashtags)];
      assert.ok(tags.includes("#wildlife"));
    }

    const page2 = (await c.get("/feed?scope=global&page=2")).data;
    const hidden = [...global.items, ...page2.items].filter((i) => i.post?.hidden);
    assert.equal(hidden.length, 1, "the post reported 3 times is flagged as hidden");
  });

  test("search: people, posts, albums, hashtags, with typos", async() =>
  {
    const c = client();
    await c.login("test@test.com");

    assert.ok((await c.get("/search?q=elefant")).data.posts.length > 0);
    assert.ok((await c.get("/search?q=kableo")).data.users.some((u) => u.username === "kabelo.drives"));
    assert.ok((await c.get("/search?q=tshilidzi@test.com")).data.users.some((u) => u.username === "tshili"));
    assert.ok((await c.get("/search?q=mountain%20hikes")).data.albums.some((a) => a.name === "Mountain Hikes"));

    const tag = (await c.get("/search?q=%23wildlfe")).data;
    assert.ok(tag.posts.length >= 3);
    assert.equal(tag.users.length, 0);
    assert.ok((await c.get("/search/suggest?q=lio")).data.length > 0);
  });

  test("profiles: non friends only see the name and picture", async() =>
  {
    const ids = await userIds();
    const c = client();
    await c.login("test@test.com");

    const stranger = (await c.get(`/users/${ids.tshili}/profile`)).data;
    assert.equal(stranger.canSeeFull, false);
    assert.equal(stranger.user.bio, undefined);
    assert.equal(stranger.posts, undefined);

    const friend = (await c.get(`/users/${ids.ditshego}/profile`)).data;
    assert.ok(friend.canSeeFull);
    assert.equal(friend.posts.length, 2);
    assert.equal(friend.user.email, undefined);
  });

  test("friends: request, accept, unfriend, decline, cancel", async() =>
  {
    const ids = await userIds();
    const me = client();
    const lerato = client();
    await me.login("test@test.com");
    await lerato.login("lerato@test.com");

    assert.equal((await me.post(`/friends/${ids.lerato}/accept`)).data.friendship, "friends");
    assert.ok((await lerato.get(`/users/${ids.lesego}/profile`)).data.canSeeFull);
    assert.ok((await lerato.get("/notifications")).data.items.some((n) => n.type === "friend_accepted"));

    assert.equal((await me.del(`/friends/${ids.lerato}`)).data.friendship, "none");
    assert.equal((await me.post(`/friends/${ids.naledi}/decline`)).status, 200);
    assert.equal((await me.post(`/friends/${ids.sipho}/request`)).data.friendship, "request-sent");
    assert.equal((await me.post(`/friends/${ids.sipho}/cancel`)).status, 200);
    assert.equal((await me.post(`/friends/${ids.lesego}/request`)).status, 400);
  });

  test("posts: create with photo, permissions, comments, reports", async() =>
  {
    const owner = client();
    const other = client();
    await owner.login("test@test.com");
    await other.login("kabelo@test.com");

    const noImage = await owner.upload("POST", "/posts", { caption: "No photo here" });
    assert.equal(noImage.status, 400);

    const wrongType = await owner.upload("POST", "/posts", { caption: "Text file" }, { field: "image", data: "hi", type: "text/plain", name: "a.txt" });
    assert.equal(wrongType.status, 400);

    const created = await owner.upload("POST", "/posts", { caption: "Test lion", hashtags: JSON.stringify(["Lion", "#Big Cats"]) },
      { field: "image", data: PHOTO, type: "image/jpeg", name: "lion.jpg" });
    assert.equal(created.status, 201);
    assert.deepEqual(created.data.hashtags, ["#lion", "#bigcats"]);
    const id = created.data._id;

    const image = await fetch(base + created.data.imageUrl);
    assert.equal(image.status, 200);

    assert.equal((await other.put(`/posts/${id}`, { caption: "hacked", hashtags: [] })).status, 403);
    assert.equal((await other.del(`/posts/${id}`)).status, 403);
    assert.equal((await owner.put(`/posts/${id}`, { caption: "Test lion edited", hashtags: "#a b" })).data.caption, "Test lion edited");

    const commented = await other.post(`/posts/${id}/comments`, { text: "Nice!" });
    assert.equal(commented.status, 201);
    assert.equal(commented.data.comments[0].author.username, "kabelo.drives");

    const reasons = (await owner.get("/reasons")).data;
    assert.equal((await owner.post(`/posts/${id}/report`, { reasonId: reasons[0]._id })).status, 400, "can't report your own post");
    assert.equal((await other.post(`/posts/${id}/report`, { reasonId: "nope" })).status, 400, "reason must exist");
    assert.equal((await other.post(`/posts/${id}/report`, { reasonId: reasons[0]._id })).status, 201);
    assert.equal((await other.post(`/posts/${id}/report`, { reasonId: reasons[0]._id })).status, 400, "only once");
  });

  test("albums: create, edit, add/remove posts, and the only-post rule", async() =>
  {
    const owner = client();
    const other = client();
    await owner.login("test@test.com");
    await other.login("kabelo@test.com");

    const post = await owner.upload("POST", "/posts", { caption: "Album test photo" },
      { field: "image", data: PHOTO, type: "image/jpeg", name: "p.jpg" });
    const postId = post.data._id;
    const someone = (await owner.get("/feed?scope=global")).data.items.find((i) => i.post && !i.post.isOwner).post._id;

    const album = (await owner.post("/albums", { name: "Two photos", hashtags: ["#x"], postIds: [postId] })).data;
    assert.equal((await other.put(`/albums/${album._id}`, { name: "Mine now" })).status, 403);
    assert.equal((await owner.put(`/albums/${album._id}`, { name: "Renamed", description: "", hashtags: "#y" })).status, 200);
    assert.equal((await owner.post(`/albums/${album._id}/posts`, { postIds: [someone] })).data.added, 1);
    assert.ok((await owner.get("/feed")).data.items.some((i) => i.type === "album_added" && i.user.username === "lesego"));
    assert.ok((await owner.get(`/posts/${postId}`)).data.albums.some((a) => a.name === "Renamed"));

    const single = (await owner.post("/albums", { name: "Only one", postIds: [postId] })).data;
    const removed = await owner.del(`/posts/${postId}`);
    assert.equal(removed.data.albumsRemoved, 1);
    assert.equal((await owner.get(`/albums/${single._id}`)).status, 404, "album with only that post is deleted");
    assert.equal((await owner.get(`/albums/${album._id}`)).status, 200, "album with other posts stays");

    assert.equal((await owner.del(`/albums/${album._id}/posts/${someone}`)).status, 200);
    assert.equal((await owner.del(`/albums/${album._id}`)).status, 200);
    assert.equal((await owner.get(`/posts/${someone}`)).status, 200, "deleting an album keeps its posts");
  });

  test("verification: request, admin approves, badge shows", async() =>
  {
    const user = client();
    const admin = client();
    const me = await user.login("test@test.com");
    await admin.login("admin@test.com");

    assert.equal((await user.post("/users/me/verification")).status, 200);
    assert.equal((await user.post("/users/me/verification")).status, 400, "already waiting");
    assert.equal((await admin.get("/admin/verifications")).data.length, 2);
    assert.equal((await admin.post(`/admin/verifications/${me._id}`, { approve: true })).data.verified, true);
    assert.equal((await user.get("/auth/me")).data.user.verified, true);
  });

  test("admin: reports, abuse detection, moderation, reasons", async() =>
  {
    const admin = client();
    const user = client();
    await admin.login("admin@test.com");
    await user.login("test@test.com");

    assert.equal((await user.get("/admin/users")).status, 403);

    const reports = (await admin.get("/admin/reports")).data;
    const spam = reports.find((p) => p.reportCount === 3);
    assert.ok(spam.reports[0].reporter.username);

    const users = (await admin.get("/admin/users")).data;
    const sipho = users.find((u) => u.username === "sipho");
    assert.ok(sipho.reportStats.flagged);
    await admin.post(`/admin/users/${sipho._id}/reporting`, { blocked: true });

    const blocked = client();
    await blocked.login("sipho@test.com");
    const reasons = (await blocked.get("/reasons")).data;
    assert.equal((await blocked.post(`/posts/${spam._id}/report`, { reasonId: reasons[0]._id })).status, 403);

    const other = reports.find((p) => p._id !== spam._id);
    assert.equal((await admin.post(`/admin/posts/${other._id}/dismiss`)).status, 200);
    assert.equal((await admin.del(`/posts/${spam._id}`, { reason: "Spam" })).status, 200);

    const owner = client();
    await owner.login("kabelo@test.com");
    assert.ok((await owner.get("/notifications")).data.items.some((n) => n.type === "post_removed"));

    assert.equal((await admin.post("/admin/reasons", { label: "Violence" })).status, 201);
    assert.equal((await admin.post("/admin/reasons", { label: "violence" })).status, 400);
  });

  test("deleting an account removes its data and friend links", async() =>
  {
    const ids = await userIds();
    const admin = client();
    await admin.login("admin@test.com");

    assert.equal((await admin.del(`/users/${ids.lethabo}`)).status, 200);
    assert.equal(await getDB().collection("posts").countDocuments({ userId: new ObjectId(ids.lethabo) }), 0);
    assert.equal(await getDB().collection("albums").countDocuments({ userId: new ObjectId(ids.lethabo) }), 0);

    const me = client();
    const user = await me.login("test@test.com");
    const fresh = (await me.get("/auth/me")).data.user;
    assert.ok(!fresh.friends.includes(ids.lethabo));
    assert.ok(user);
    assert.equal((await me.get(`/users/${ids.lethabo}/profile`)).status, 404);
  });
});
