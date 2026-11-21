// Student Number: u25143230
//saves every collection to database/<name>.json: npm run export
import fs from "node:fs";
import path from "node:path";
import { EJSON } from "mongodb";
import { connectToMongoDB, getDB, disconnectFromMongoDB } from "../db.js";

const COLLECTIONS = ["users", "posts", "albums", "activities", "reasons", "reports", "notifications"];
const OUT_DIR = path.join(import.meta.dirname, "..", "..", "database");

async function exportDB()
{
  await connectToMongoDB();
  const db = getDB();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for(const name of COLLECTIONS)
  {
    const docs = await db.collection(name).find({}).toArray();

    //extended JSON keeps ObjectIds and dates, so it can be imported with mongoimport
    const json = EJSON.stringify(docs, null, 2, { relaxed: false });
    fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), json);
    console.log(`${name}: ${docs.length} documents`);
  }

  console.log(`saved to ${OUT_DIR}`);
  await disconnectFromMongoDB();
}

exportDB().catch((err) =>
{
  console.error("export failed:", err);
  process.exit(1);
});
