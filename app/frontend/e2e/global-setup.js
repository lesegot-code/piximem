import { execSync } from "node:child_process";

//fresh demo data before the tests run (E2E_SEED_CMD can replace the command)
export default function globalSetup()
{
  if(!process.env.E2E_SEED_CMD && !process.env.MONGODB_DB)
  {
    throw new Error("Set MONGODB_DB to a test database name. Seeding wipes it, so never point it at real data.");
  }

  execSync(process.env.E2E_SEED_CMD || "npm --prefix ../backend run seed", { stdio: "inherit" });
}
