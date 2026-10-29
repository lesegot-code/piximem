// Student Number: u25143230

import { connectToMongoDB, getDB, disconnectFromMongoDB } from "./db.js";

async function seed()
{
  await connectToMongoDB();
  const db = getDB();

  console.log("clearing collections...");
  await db.collection("users").deleteMany({});
  await db.collection("posts").deleteMany({});
  await db.collection("albums").deleteMany({});

  // -- users --
  // test@test.com / test1234
  const rawUsers = [
    { email: "test@test.com",       password: "test1234", username: "Lesego",           bio: "Capturing life's small moments. Coffee, cameras, and trail runs.", isAdmin: false },
    { email: "ditshego@test.com",   password: "test1234", username: "Ditshegofatso",    bio: "Wildlife photographer. Boerboel mom.",                              isAdmin: false },
    { email: "kabelo@test.com",     password: "test1234", username: "Kabelo",           bio: "Cars, coffee, and code. Weekend drives.",                          isAdmin: false },
    { email: "lethabo@test.com",    password: "test1234", username: "Lethabo",          bio: "Mountains > beaches. Always chasing sunrise.",                     isAdmin: false },
    { email: "tshilidzi@test.com",  password: "test1234", username: "Tshilidzi",        bio: "Street photography and city lights.",                              isAdmin: false },
    { email: "thabo@test.com",      password: "test1234", username: "Thabo",            bio: "Nature, wildlife, and long hikes.",                                isAdmin: false },
    { email: "lerato@test.com",     password: "test1234", username: "Lerato",           bio: "Film photographer. Slow days, good light.",                        isAdmin: false },
    { email: "admin@test.com",      password: "test1234", username: "Admin",            bio: "Site moderator.",                                                  isAdmin: true },
  ];

  const insertedUsers = await db.collection("users").insertMany(
    rawUsers.map((u) => ({
      ...u,
      avatar: null,
      friends: [],
      friendRequests: [],
      createdAt: new Date(),
    }))
  );

  // maps username -> _id
  const id = (username) => insertedUsers.insertedIds[
    rawUsers.findIndex((u) => u.username === username)
  ];

  console.log("users inserted:", insertedUsers.insertedCount);

  // -- friendships --
  // Lesego (test@test.com) is friends with Ditshegofatso, Kabelo, Lethabo
  const lesegoId = id("Lesego");
  const ditshegoId = id("Ditshegofatso");
  const kabeloId = id("Kabelo");
  const lethaboId = id("Lethabo");
  const tshilidziId = id("Tshilidzi");
  const thaboId = id("Thabo");
  const leratoId = id("Lerato");
  const adminId = id("Admin");

  await db.collection("users").updateOne(
    { _id: lesegoId },
    { $set: { friends: [ditshegoId, kabeloId, lethaboId] } }
  );
  await db.collection("users").updateOne(
    { _id: ditshegoId },
    { $set: { friends: [lesegoId] } }
  );
  await db.collection("users").updateOne(
    { _id: kabeloId },
    { $set: { friends: [lesegoId, tshilidziId] } }
  );
  await db.collection("users").updateOne(
    { _id: lethaboId },
    { $set: { friends: [lesegoId, thaboId] } }
  );
  await db.collection("users").updateOne(
    { _id: tshilidziId },
    { $set: { friends: [kabeloId] } }
  );
  await db.collection("users").updateOne(
    { _id: thaboId },
    { $set: { friends: [lethaboId] } }
  );

  // pending friend request from Lerato -> Lesego (shows "request-received")
  await db.collection("users").updateOne(
    { _id: lesegoId },
    { $set: { friendRequests: [leratoId] } }
  );

  console.log("friendships + requests set");

  // -- posts --
  const now = Date.now();
  const days = (n) => new Date(now - n * 24 * 60 * 60 * 1000);

  const rawPosts = [
    {
      userId: ditshegoId,
      caption: "Golden hour at Table Mountain — the city lit up like a circuit board.",
      hashtags: ["#capetown", "#sunset", "#nature"],
      createdAt: days(0.2),
    },
    {
      userId: kabeloId,
      caption: "Weekend drive up Chapman's Peak. That road never gets old.",
      hashtags: ["#cars", "#travel", "#capetown"],
      createdAt: days(0.5),
    },
    {
      userId: lesegoId,
      caption: "My boerboel 'Shadow' discovered the sprinkler today.",
      hashtags: ["#pets", "#boerboel", "#happiness"],
      createdAt: days(1),
    },
    {
      userId: lethaboId,
      caption: "Sunrise hike up Lion's Head. Legs are sore, soul is full.",
      hashtags: ["#hiking", "#sunrise", "#nature"],
      createdAt: days(2),
    },
    {
      userId: tshilidziId,
      caption: "City lights and late-night shoots in Maboneng.",
      hashtags: ["#streetphotography", "#johannesburg", "#night"],
      createdAt: days(3),
    },
    {
      userId: thaboId,
      caption: "Spotted this little guy on the Garden Route. Patience pays off.",
      hashtags: ["#wildlife", "#birds", "#gardenroute"],
      createdAt: days(4),
    },
    {
      userId: lesegoId,
      caption: "Slow morning. Fresh coffee and old film rolls.",
      hashtags: ["#coffee", "#filmphotography", "#slowmornings"],
      createdAt: days(5),
    },
    {
      userId: ditshegoId,
      caption: "Karoo skies are unreal. No filter needed.",
      hashtags: ["#karoo", "#stars", "#travel"],
      createdAt: days(6),
    },
    {
      userId: kabeloId,
      caption: "Sunday wash day. My weekend toy.",
      hashtags: ["#cars", "#classic", "#weekend"],
      createdAt: days(7),
    },
    {
      userId: adminId,
      caption: "Community reminder: tag responsibly and keep it kind.",
      hashtags: ["#community", "#rules"],
      createdAt: days(8),
    },
  ];

  const insertedPosts = await db.collection("posts").insertMany(
    rawPosts.map((p) => ({
      ...p,
      image: null,
      comments: [],
      reports: [],
    }))
  );

  const postIds = insertedPosts.insertedIds;
  console.log("posts inserted:", insertedPosts.insertedCount);

  // -- one reported post --
  await db.collection("posts").updateOne(
    { _id: postIds[4] },
    {
      $set: {
        reports: [
          { userId: lesegoId, reason: "Spam or misleading", createdAt: new Date() },
          { userId: ditshegoId, reason: "Inappropriate content", createdAt: new Date() },
          { userId: thaboId, reason: "Spam or misleading", createdAt: new Date() },
        ],
      },
    }
  );

  // -- comments on the first post --
  await db.collection("posts").updateOne(
    { _id: postIds[0] },
    {
      $push: {
        comments: {
          $each: [
            { _id: null, userId: lesegoId, username: "Lesego",   text: "Stunning!",                     createdAt: days(0.19) },
            { _id: null, userId: kabeloId, username: "Kabelo",   text: "Where is this exactly?",        createdAt: days(0.18) },
            { _id: null, userId: lethaboId, username: "Lethabo", text: "Need to do this hike soon.",    createdAt: days(0.17) },
          ],
        },
      },
    }
  );

  // -- albums --
  // 5 albums, each referencing a few posts
  const rawAlbums = [
    {
      userId: ditshegoId,
      name: "Cape Town Sunsets",
      description: "Chasing that golden light every evening.",
      hashtags: ["#capetown", "#sunset"],
      posts: [postIds[0], postIds[1]],
    },
    {
      userId: lesegoId,
      name: "Everyday Moments",
      description: "Coffee, pets, and slow weekends.",
      hashtags: ["#pets", "#coffee"],
      posts: [postIds[2], postIds[6]],
    },
    {
      userId: lethaboId,
      name: "Mountain Hikes",
      description: "Sunrise trails and sore legs.",
      hashtags: ["#hiking", "#nature"],
      posts: [postIds[3]],
    },
    {
      userId: tshilidziId,
      name: "City After Dark",
      description: "Lights, streets, and late shoots.",
      hashtags: ["#night", "#johannesburg"],
      posts: [postIds[4]],
    },
    {
      userId: kabeloId,
      name: "Weekend Drives",
      description: "Coastal roads and mountain passes.",
      hashtags: ["#cars", "#travel"],
      posts: [postIds[1], postIds[8]],
    },
  ];

  const insertedAlbums = await db.collection("albums").insertMany(
    rawAlbums.map((a) => ({
      ...a,
      createdAt: new Date(),
    }))
  );

  console.log("albums inserted:", insertedAlbums.insertedCount);
  console.log("");
  console.log("seed complete");
  console.log("login with: test@test.com / test1234");

  await disconnectFromMongoDB();
}

seed().catch((err) =>
{
  console.error("seed failed:", err);
  process.exit(1);
});