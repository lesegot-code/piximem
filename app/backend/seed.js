// Student Number: u25143230

import { ObjectId } from "mongodb";
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

  //each post uses a photo from seed-images (copied into /uploads when the server starts)
  const rawPosts = [
    {
      userId: ditshegoId,
      caption: "Elephants at the waterhole right before sunset. The reflections did all the work.",
      hashtags: ["#wildlife", "#elephants", "#sunset"],
      image: "Elephant1.jpg",
      createdAt: days(0.2),
    },
    {
      userId: kabeloId,
      caption: "Took the Defender up a snowy pass this weekend. That road never gets old.",
      hashtags: ["#cars", "#travel", "#roadtrip"],
      image: "CAR1.jpg",
      createdAt: days(0.5),
    },
    {
      userId: lesegoId,
      caption: "Morning walk through the forest. The light came through the trees right on time.",
      hashtags: ["#nature", "#morningwalk", "#sunlight"],
      image: "Nature16.jpg",
      createdAt: days(1),
    },
    {
      userId: lethaboId,
      caption: "Hiked down to this valley lake. Legs are sore, soul is full.",
      hashtags: ["#hiking", "#mountains", "#nature"],
      image: "Nature7.jpg",
      createdAt: days(2),
    },
    {
      userId: tshilidziId,
      caption: "Rainy afternoon in Paris, but the tower still had to be in the frame.",
      hashtags: ["#travel", "#paris", "#streetphotography"],
      image: "Travel2.jpg",
      createdAt: days(3),
    },
    {
      userId: thaboId,
      caption: "Two kingfishers sharing a meal. Patience pays off.",
      hashtags: ["#wildlife", "#birds", "#kingfisher"],
      image: "Birds1.jpg",
      createdAt: days(4),
    },
    {
      userId: lesegoId,
      caption: "Golden hour from the cliffs. Just me, my camera and the view.",
      hashtags: ["#photography", "#goldenhour", "#nature"],
      image: "Nature2.jpg",
      createdAt: days(5),
    },
    {
      userId: ditshegoId,
      caption: "This lion sat perfectly still under a burning sky. No filter needed.",
      hashtags: ["#wildlife", "#lion", "#sky"],
      image: "Lion1.jpg",
      createdAt: days(6),
    },
    {
      userId: kabeloId,
      caption: "Sunday drive under the blossom trees. My weekend toy.",
      hashtags: ["#cars", "#classic", "#weekend"],
      image: "CAR2.jpg",
      createdAt: days(7),
    },
    {
      userId: adminId,
      caption: "Community reminder: tag responsibly and keep it kind.",
      hashtags: ["#community", "#rules"],
      image: "Nature3.jpg",
      createdAt: days(8),
    },
  ];

  const insertedPosts = await db.collection("posts").insertMany(
    rawPosts.map((p) => ({
      ...p,
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
            { _id: new ObjectId(), userId: lesegoId, username: "Lesego",   text: "Stunning!",                 createdAt: days(0.19) },
            { _id: new ObjectId(), userId: kabeloId, username: "Kabelo",   text: "Where is this exactly?",    createdAt: days(0.18) },
            { _id: new ObjectId(), userId: lethaboId, username: "Lethabo", text: "The reflection is unreal.", createdAt: days(0.17) },
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
      name: "Wild Sunsets",
      description: "Animals in that golden evening light.",
      hashtags: ["#wildlife", "#sunset"],
      posts: [postIds[0], postIds[7]],
    },
    {
      userId: lesegoId,
      name: "Everyday Moments",
      description: "Morning walks and golden hours.",
      hashtags: ["#nature", "#goldenhour"],
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
      name: "City Walks",
      description: "Streets, rain, and famous landmarks.",
      hashtags: ["#travel", "#streetphotography"],
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