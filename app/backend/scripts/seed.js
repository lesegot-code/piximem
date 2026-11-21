// Student Number: u25143230
//wipes the database and fills it with demo data: npm run seed
import { connectToMongoDB, getDB, disconnectFromMongoDB } from "../db.js";
import { seedDatabase } from "./seed-data.js";

try
{
  await connectToMongoDB();
  await seedDatabase(getDB());
  await disconnectFromMongoDB();
}
catch(err)
{
  console.error("seed failed:", err.message);
  process.exit(1);
}
