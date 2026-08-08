const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "..", "..", "data");

module.exports = {
  port: process.env.PORT || 3000,
  dataDir: dataDir,
  databaseUrl: process.env.DATABASE_URL || `file:${path.join(dataDir, "dev.db")}`,
  adminPassword: process.env.ADMIN_PASSWORD || "admin",
  sessionSecret: process.env.SESSION_SECRET || "de-trainer-secure-session-key-2026-v1",
  sessionMaxAge: 1000 * 60 * 60 * 24 // 24 hours
};
