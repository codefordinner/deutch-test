const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const config = require("../config");

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

// Ensure process.env.DATABASE_URL is set for Prisma
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = config.databaseUrl;
}

// Auto-run Prisma db push and initial JSON migration if necessary
function initializeDatabase() {
  try {
    const rootDir = path.join(__dirname, "..", "..");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", cwd: rootDir });
    const migrateScript = path.join(rootDir, "migrate-json.js");
    if (fs.existsSync(migrateScript)) {
      execSync(`node "${migrateScript}"`, { stdio: "inherit", cwd: rootDir });
    }
  } catch (err) {
    console.warn("[Database Init] Prisma db push / migrate warning:", err.message);
  }
}

initializeDatabase();

let prisma;
try {
  prisma = new PrismaClient();
} catch (err) {
  console.warn("[Database Init] PrismaClient initialization error:", err.message);
}

module.exports = prisma;
