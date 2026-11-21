// Student Number: u25143230
//small pure functions, no database needed: npm run test:unit
import { test } from "node:test";
import assert from "node:assert/strict";
import { editDistance, scoreText, rank } from "../lib/search.js";
import { parseHashtags, isValidId } from "../lib/helpers.js";
import { signParams, publicIdFromUrl, parseCloudinaryUrl } from "../lib/upload.js";
import { hashPassword, checkPassword } from "../lib/auth.js";

test("edit distance counts a swap as one change", () =>
{
  assert.equal(editDistance("kitten", "sitting"), 3);
  assert.equal(editDistance("teh", "the"), 1);
  assert.equal(editDistance("same", "same"), 0);
});

test("fuzzy search finds typos, unfinished words and sound-alikes", () =>
{
  assert.ok(scoreText("elefant", "Elephants at the waterhole") > 0);
  assert.ok(scoreText("elefa", "Elephants at the waterhole") > 0);
  assert.ok(scoreText("kableo", "kabelo.drives") > 0);
  assert.ok(scoreText("mountian", "Mountain Hikes") > 0);
  assert.ok(scoreText("fotography", "#photography") > 0);
});

test("fuzzy search does not match unrelated words", () =>
{
  assert.equal(scoreText("car", "Morning walk through the forest"), 0);
  assert.equal(scoreText("lion", "Lethabo"), 0);
  assert.equal(scoreText("cat", "castle"), 0);
});

test("exact matches rank above fuzzy ones", () =>
{
  const items = ["Elefant sticker", "Elephants at sunset"];
  assert.deepEqual(rank(items, (t) => scoreText("elephants", t)), ["Elephants at sunset", "Elefant sticker"]);
});

test("hashtags are cleaned, lowercased and unique", () =>
{
  assert.deepEqual(parseHashtags("Nature, #sunset sunset #Big-Cats"), ["#nature", "#sunset", "#bigcats"]);
  assert.deepEqual(parseHashtags(JSON.stringify(["#a", "b"])), ["#a", "#b"]);
  assert.deepEqual(parseHashtags(""), []);
  assert.equal(parseHashtags(Array.from({ length: 30 }, (_, i) => `t${i}`)).length, 15);
});

test("only real ObjectId strings are valid ids", () =>
{
  assert.ok(isValidId("6740aa1b2c3d4e5f60718293"));
  assert.ok(!isValidId("not-an-id"));
  assert.ok(!isValidId("123456789012")); //12 characters, but not hex
});

test("passwords are hashed and checked, old plain text still works", () =>
{
  const stored = hashPassword("test1234");
  assert.ok(stored.startsWith("scrypt$"));
  assert.ok(checkPassword("test1234", stored));
  assert.ok(!checkPassword("wrong", stored));
  assert.ok(checkPassword("plain", "plain"));
});

test("cloudinary signature matches the example in Cloudinary's docs", () =>
{
  const params = {
    timestamp: 1315060510,
    public_id: "sample_image",
    eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
  };
  assert.equal(signParams(params, "abcd"), "bfd09f95f331f558cbd1320e67aa8d488770583e");
});

test("cloudinary urls are parsed", () =>
{
  assert.deepEqual(parseCloudinaryUrl("cloudinary://123:abc@demo"), { apiKey: "123", apiSecret: "abc", cloudName: "demo" });
  assert.equal(parseCloudinaryUrl(""), null);
  assert.throws(() => parseCloudinaryUrl("https://wrong"));

  assert.equal(
    publicIdFromUrl("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_1600/v1712/pixel-memory/abc123.jpg"),
    "pixel-memory/abc123"
  );
  assert.equal(publicIdFromUrl("https://res.cloudinary.com/demo/image/upload/v1712/pixel-memory/abc.png"), "pixel-memory/abc");
});
