const path = require("path");

const rootDir = path.join(__dirname, "..", "..");
const dataDir = path.join(rootDir, "data");
const prismaDir = path.join(rootDir, "prisma");

module.exports = {
  port: process.env.PORT || 3000,
  rootDir: rootDir,
  dataDir: dataDir,
  prismaDir: prismaDir,
  databaseUrl: process.env.DATABASE_URL || `file:${path.join(prismaDir, "dev.db")}`,
  adminPassword: process.env.ADMIN_PASSWORD || "admin",
  sessionSecret: process.env.SESSION_SECRET || "de-trainer-secure-session-key-2026-v1",
  sessionMaxAge: 1000 * 60 * 60 * 24 // 24 hours
};

