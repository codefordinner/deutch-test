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
process.env.DATABASE_URL = config.databaseUrl;

// Auto-run Prisma db push and initial JSON migration if needed
function initializeDatabase() {
  if (process.env.PRISMA_NO_INIT === "true") {
    return;
  }
  try {
    const rootDir = path.join(__dirname, "..", "..");
    const prismaDir = path.join(rootDir, "prisma");
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }

    // Always run db push to ensure schema columns and client are up to date
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "ignore",
      cwd: rootDir,
      env: { ...process.env, DATABASE_URL: config.databaseUrl, PRISMA_NO_INIT: "true" }
    });

    const migrateScript = path.join(rootDir, "migrate-json.js");
    if (fs.existsSync(migrateScript)) {
      execSync(`node "${migrateScript}"`, {
        stdio: "ignore",
        cwd: rootDir,
        env: { ...process.env, DATABASE_URL: config.databaseUrl, PRISMA_NO_INIT: "true" }
      });
    }

    const seedScript = path.join(rootDir, "seed-verbs.js");
    if (fs.existsSync(seedScript)) {
      execSync(`node "${seedScript}"`, {
        stdio: "ignore",
        cwd: rootDir,
        env: { ...process.env, DATABASE_URL: config.databaseUrl, PRISMA_NO_INIT: "true" }
      });
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
  console.warn("[Database Init] PrismaClient initialization error, using in-memory mock fallback:", err.message);
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d) => d?.data ?? {},
    update: async (d) => d?.data ?? {},
    delete: async () => ({}),
    updateMany: async () => ({ count: 0 })
  };
  prisma = new Proxy({}, { get: () => noOp });
}

module.exports = prisma;
