// Student Number: u25143230
//the demo data (used by npm run seed and by the automated tests)
import { ObjectId } from "mongodb";
import crypto from "node:crypto";
import { hashPassword } from "../lib/auth.js";

const COLLECTIONS = ["users", "posts", "albums", "activities", "reasons", "reports", "notifications", "sessions"];

const now = Date.now();
const days = (n) => new Date(now - n * 24 * 60 * 60 * 1000);

//wipes every collection, then inserts the demo users, posts, albums and so on
export async function seedDatabase(db, { quiet = false } = {})
{
  const log = quiet ? () => {} : console.log;

  log("clearing collections...");
  for(const name of COLLECTIONS) await db.collection(name).deleteMany({});

  // -- users -- (every password is test1234)
  const rawUsers = [
    { key: "lesego",   email: "test@test.com",      username: "lesego",       name: "Lesego",        pronouns: "she/her", location: "Pretoria",       bio: "Capturing life's small moments. Coffee, cameras and trail runs.", age: 20 },
    { key: "ditshego", email: "ditshego@test.com",  username: "ditshego",     name: "Ditshegofatso", pronouns: "she/her", location: "Kruger Park",    bio: "Wildlife photographer. Always out before sunrise.",               age: 40 },
    { key: "kabelo",   email: "kabelo@test.com",    username: "kabelo.drives", name: "Kabelo",       pronouns: "he/him",  location: "Johannesburg",   bio: "Cars, coffee and code. Weekend drives.",                          age: 35, verified: true, website: "https://example.com/kabelo" },
    { key: "lethabo",  email: "lethabo@test.com",   username: "lethabo",      name: "Lethabo",       pronouns: "he/him",  location: "Drakensberg",    bio: "Mountains over beaches. Always chasing the next trail.",          age: 25 },
    { key: "tshili",   email: "tshilidzi@test.com", username: "tshili",       name: "Tshilidzi",     pronouns: "they/them", location: "Cape Town",    bio: "Street photography and travel diaries.",                          age: 15 },
    { key: "thabo",    email: "thabo@test.com",     username: "thabo.wild",   name: "Thabo",         pronouns: "he/him",  location: "Garden Route",   bio: "Birds, patience and long lenses.",                                age: 30 },
    { key: "lerato",   email: "lerato@test.com",    username: "lerato",       name: "Lerato",        pronouns: "she/her", location: "Durban",         bio: "Coastlines and backpacks.",                                       age: 10 },
    { key: "naledi",   email: "naledi@test.com",    username: "naledi",       name: "Naledi",        pronouns: "she/her", location: "Bloemfontein",   bio: "New here, learning photography one photo at a time.",            age: 3 },
    { key: "sipho",    email: "sipho@test.com",     username: "sipho",        name: "Sipho",         pronouns: "he/him",  location: "Polokwane",      bio: "Just looking around.",                                            age: 28 },
    { key: "admin",    email: "admin@test.com",     username: "admin",        name: "Pixel Memory Team", pronouns: "",    location: "",               bio: "Site moderators. Keep it kind.",                                   age: 60, isAdmin: true, verified: true },
  ];

  const password = hashPassword("test1234");
  const users = rawUsers.map((u) => ({
    _id: new ObjectId(),
    email: u.email,
    password,
    username: u.username,
    name: u.name,
    pronouns: u.pronouns,
    bio: u.bio,
    location: u.location,
    website: u.website || "",
    avatar: null,
    avatarSeed: crypto.randomBytes(8).toString("hex"),
    friends: [],
    friendRequests: [],
    favourites: [],
    isAdmin: Boolean(u.isAdmin),
    verified: Boolean(u.verified),
    verification: null,
    reportingBlocked: false,
    createdAt: days(u.age),
  }));

  const U = {};
  rawUsers.forEach((u, i) => { U[u.key] = users[i]; });
  const id = (key) => U[key]._id;

  // -- friendships (stored on both people) --
  const friendPairs = [
    ["lesego", "ditshego"], ["lesego", "kabelo"], ["lesego", "lethabo"],
    ["ditshego", "thabo"], ["kabelo", "tshili"], ["lethabo", "thabo"], ["lethabo", "naledi"],
  ];
  for(const [a, b] of friendPairs)
  {
    U[a].friends.push(id(b));
    U[b].friends.push(id(a));
  }

  //requests are stored on the person receiving them
  U.lesego.friendRequests.push(id("lerato"), id("naledi"));
  U.lesego.favourites.push(id("ditshego"));
  U.ditshego.verification = { status: "pending", requestedAt: days(1) };

  await db.collection("users").insertMany(users);
  log("users inserted:", users.length);

  // -- posts -- (images come from seed-images, copied to /uploads when the server starts)
  const rawPosts = [
    { by: "ditshego", image: "Elephant1.jpg", age: 0.2,  caption: "Elephants at the waterhole right before sunset. The reflections did all the work.", tags: ["#wildlife", "#elephants", "#sunset"] },
    { by: "kabelo",   image: "CAR1.jpg",      age: 0.5,  caption: "Took the Defender up a snowy pass this weekend. That road never gets old.", tags: ["#cars", "#roadtrip", "#snow"] },
    { by: "lesego",   image: "Nature16.jpg",  age: 1,    caption: "Morning walk through the forest. The light came through the trees right on time.", tags: ["#nature", "#morningwalk", "#sunlight"] },
    { by: "lethabo",  image: "Nature7.jpg",   age: 2,    caption: "Hiked down to this valley lake. Legs are sore, soul is full.", tags: ["#hiking", "#mountains", "#nature"] },
    { by: "tshili",   image: "Travel2.jpg",   age: 3,    caption: "Rainy afternoon in Paris, but the tower still had to be in the frame.", tags: ["#travel", "#paris", "#streetphotography"] },
    { by: "lesego",   image: "Travel1.jpg",   age: 3.5,  caption: "Boat day between the fjords. Freezing water, warm memories.", tags: ["#travel", "#lake", "#adventure"] },
    { by: "thabo",    image: "Birds1.jpg",    age: 4,    caption: "Two kingfishers sharing a meal. Patience pays off.", tags: ["#wildlife", "#birds", "#kingfisher"] },
    { by: "lesego",   image: "Nature2.jpg",   age: 5,    caption: "Golden hour from the cliffs. Just me, my camera and the view.", tags: ["#photography", "#goldenhour", "#nature"] },
    { by: "ditshego", image: "Lion1.jpg",     age: 6,    caption: "This lion sat perfectly still under a burning sky. No filter needed.", tags: ["#wildlife", "#lion", "#goldenhour"] },
    { by: "kabelo",   image: "CAR2.jpg",      age: 7,    caption: "Sunday drive under the blossom trees. My weekend toy.", tags: ["#cars", "#classic", "#weekend"] },
    { by: "admin",    image: "Nature3.jpg",   age: 8,    caption: "Welcome to Pixel Memory! Tag your photos, keep comments kind and report anything that breaks the rules.", tags: ["#community", "#welcome"] },
    { by: "thabo",    image: "Birds2.jpg",    age: 9,    caption: "Terns arguing over dinner in the last light of the day.", tags: ["#birds", "#wildlife", "#goldenhour"] },
    { by: "kabelo",   image: "CAR3.jpg",      age: 10,   caption: "Desert road, yellow paint. Selling rides, DM me for prices!!", tags: ["#cars", "#desert"] },
    { by: "lerato",   image: "Travel3.jpg",   age: 11,   caption: "Found a quiet cliff above the ocean and stayed until the sun moved.", tags: ["#travel", "#coast", "#adventure"] },
    { by: "tshili",   image: "Travel5.jpg",   age: 12,   caption: "Castle day! Felt like a kid again.", tags: ["#travel", "#castle"] },
  ];

  const posts = rawPosts.map((p) => ({
    _id: new ObjectId(),
    userId: id(p.by),
    caption: p.caption,
    hashtags: p.tags,
    image: p.image,
    comments: [],
    reports: [],
    createdAt: days(p.age),
  }));
  const P = (i) => posts[i];

  // -- comments --
  const comment = (postIndex, by, text, ageOffset) =>
  {
    const post = P(postIndex);
    post.comments.push({
      _id: new ObjectId(),
      userId: id(by),
      text,
      createdAt: new Date(post.createdAt.getTime() + ageOffset * 60 * 60 * 1000),
    });
  };

  comment(0, "lesego", "Stunning!", 0.2);
  comment(0, "kabelo", "Where is this exactly?", 0.4);
  comment(0, "ditshego", "Sabi Sands, about 20 minutes before dark.", 0.6);
  comment(0, "lethabo", "The reflection is unreal.", 0.8);
  comment(0, "thabo", "That baby elephant in the middle!", 1);
  comment(0, "lesego", "Saving this one to my wildlife album.", 1.2);
  comment(1, "lesego", "That pass looks freezing.", 1);
  comment(1, "tshili", "Defender gang.", 2);
  comment(2, "ditshego", "The light here is beautiful.", 2);
  comment(3, "thabo", "Which trail is this?", 3);
  comment(3, "lesego", "Adding this to my hiking list.", 4);
  comment(4, "kabelo", "Paris in the rain is a mood.", 1);
  comment(5, "lethabo", "This is going on my bucket list.", 2);
  comment(6, "ditshego", "How long did you wait for this shot?", 1);
  comment(6, "thabo", "About three hours. Worth it.", 2);
  comment(6, "lesego", "Kingfishers are my favourite.", 3);
  comment(7, "kabelo", "Golden hour done right.", 2);
  comment(8, "thabo", "Incredible mane.", 1);
  comment(8, "ditshego", "He let us watch for almost an hour.", 2);
  comment(9, "tshili", "Classic!", 3);
  comment(11, "ditshego", "Perfect timing.", 2);
  comment(13, "lethabo", "Where is this?", 5);

  // -- reports -- post 13 (index 12) is reported 3 times so it is hidden in the feed
  const reportLog = [];
  const report = (postIndex, by, reason, ageDays) =>
  {
    const createdAt = days(ageDays);
    P(postIndex).reports.push({ _id: new ObjectId(), userId: id(by), reason, createdAt });
    reportLog.push({ userId: id(by), postId: P(postIndex)._id, postOwnerId: P(postIndex).userId, reason, outcome: "open", createdAt });
  };

  report(12, "lerato", "Spam or misleading", 9);
  report(12, "tshili", "Spam or misleading", 8);
  report(12, "thabo", "Spam or misleading", 7);
  report(4, "sipho", "Inappropriate content", 1);

  //sipho reported a lot of normal posts before, admins dismissed them (shows up as possible abuse)
  for(const [postIndex, ageDays] of [[2, 4], [3, 4], [6, 3], [7, 3], [9, 2]])
  {
    reportLog.push({
      userId: id("sipho"),
      postId: P(postIndex)._id,
      postOwnerId: P(postIndex).userId,
      reason: "Inappropriate content",
      outcome: "dismissed",
      createdAt: days(ageDays),
      resolvedAt: days(ageDays - 0.5),
    });
  }

  await db.collection("posts").insertMany(posts);
  await db.collection("reports").insertMany(reportLog);
  log("posts inserted:", posts.length);

  // -- report reasons (admins can add more) --
  const reasons = ["Spam or misleading", "Inappropriate content", "Harassment or hate", "Copyright violation", "Something else"];
  await db.collection("reasons").insertMany(reasons.map((label) => ({ label, createdAt: days(60) })));

  // -- albums -- (albums can also hold other people's posts, like a saved collection)
  const rawAlbums = [
    { by: "ditshego", name: "Wild Sunsets",   description: "Animals in that golden evening light.", tags: ["#wildlife", "#sunset"],        posts: [0, 8],   age: 0.15 },
    { by: "lesego",   name: "Golden Hours",   description: "Morning walks and evening light.",      tags: ["#nature", "#goldenhour"],      posts: [2, 7],   age: 0.9 },
    { by: "lesego",   name: "Wildlife I Love", description: "Favourite animal shots from friends.", tags: ["#wildlife", "#birds"],         posts: [6, 11],  age: 3.8 },
    { by: "lethabo",  name: "Mountain Hikes", description: "Trails, lakes and sore legs.",          tags: ["#hiking", "#mountains"],       posts: [3],      age: 1.9 },
    { by: "tshili",   name: "City Walks",     description: "Streets, rain and famous landmarks.",   tags: ["#travel", "#streetphotography"], posts: [4, 14], age: 2.9 },
    { by: "kabelo",   name: "Weekend Drives", description: "Coastal roads and mountain passes.",    tags: ["#cars", "#roadtrip"],          posts: [9, 12],  age: 6.9 },
  ];

  const albums = rawAlbums.map((a) => ({
    _id: new ObjectId(),
    userId: id(a.by),
    name: a.name,
    description: a.description,
    hashtags: a.tags,
    posts: a.posts.map((i) => P(i)._id),
    createdAt: days(a.age),
    updatedAt: days(a.age),
  }));

  //each album shows up as activity in the feed
  const activities = albums.map((a) => ({
    type: "album_created",
    userId: a.userId,
    albumId: a._id,
    postIds: [...a.posts],
    createdAt: a.createdAt,
  }));

  //Kabelo added his newest photo to Weekend Drives later on
  const drives = albums[5];
  drives.posts.push(P(1)._id);
  drives.updatedAt = days(0.4);
  activities.push({ type: "album_added", userId: drives.userId, albumId: drives._id, postIds: [P(1)._id], createdAt: days(0.4) });

  await db.collection("albums").insertMany(albums);
  await db.collection("activities").insertMany(activities);
  log("albums inserted:", albums.length);

  // -- notifications --
  await db.collection("notifications").insertMany([
    { userId: id("lesego"), type: "friend_request", message: "lerato sent you a friend request.", link: `/profile/${id("lerato")}`, read: false, createdAt: days(2) },
    { userId: id("lesego"), type: "friend_request", message: "naledi sent you a friend request.", link: `/profile/${id("naledi")}`, read: false, createdAt: days(1) },
    { userId: id("kabelo"), type: "verification", message: "Your account is now verified.", link: `/profile/${id("kabelo")}`, read: true, createdAt: days(20) },
  ]);

  log("");
  log("seed complete");
  log("login with: test@test.com / test1234 (admin: admin@test.com / test1234)");
}
