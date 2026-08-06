require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure DATABASE_URL is set for SQLite
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(dataDir, "dev.db")}`;
}

// Prepare Prisma SQLite database schema and seed json data if possible
try {
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  const migrateScript = path.join(__dirname, "migrate-json.js");
  if (fs.existsSync(migrateScript)) {
    execSync(`node "${migrateScript}"`, { stdio: "inherit" });
  }
} catch (err) {
  console.warn("[AI Studio] Database auto-setup warning:", err.message);
}

let prisma;
try {
  prisma = new PrismaClient();
} catch (err) {
  console.warn("[AI Studio] PrismaClient init error:", err.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
  })
);

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Требуется вход в админ-панель" });
}

// ---------- auth ----------

app.post("/api/admin/login", (req, res) => {
  const password = req.body.password || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";

  if (password === adminPassword) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Неверный пароль" });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/status", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.get("/admin.html", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.sendFile(path.join(__dirname, "public", "admin.html"));
  }
  return res.redirect("/admin-login.html");
});

// static files (css/js/images + index.html, admin-login.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ---------- categories (read: public, write: admin only) ----------

app.get("/api/categories", async (req, res) => {
  try {
    if (!prisma) throw new Error("Prisma client not initialized");
    const categories = await prisma.category.findMany({
      include: {
        words: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });
    res.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    try {
      const dbJsonPath = path.join(__dirname, "data", "db.json");
      if (fs.existsSync(dbJsonPath)) {
        const raw = fs.readFileSync(dbJsonPath, "utf-8");
        const parsed = JSON.parse(raw);
        return res.json(parsed.categories || []);
      }
    } catch (e) {
      console.error("Fallback json read error:", e);
    }
    res.status(500).json({ error: "Ошибка сервера при получении категорий" });
  }
});

app.post("/api/categories", requireAdmin, async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Название категории обязательно" });

  try {
    const category = await prisma.category.create({
      data: { name },
      include: { words: true }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error("POST /api/categories error:", error);
    res.status(500).json({ error: "Ошибка при создании категории" });
  }
});

app.put("/api/categories/:id", requireAdmin, async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Название категории обязательно" });

  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name },
      include: { words: true }
    });
    res.json(category);
  } catch (error) {
    console.error("PUT /api/categories/:id error:", error);
    res.status(404).json({ error: "Категория не найдена или ошибка обновления" });
  }
});

app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (error) {
    console.error("DELETE /api/categories/:id error:", error);
    res.status(404).json({ error: "Категория не найдена" });
  }
});

// ---------- words (write: admin only) ----------

app.post("/api/categories/:id/words", requireAdmin, async (req, res) => {
  const de = (req.body.de || "").trim();
  const ru = (req.body.ru || "").trim();
  if (!de || !ru) return res.status(400).json({ error: "Нужны оба поля: de и ru" });

  try {
    const categoryExists = await prisma.category.findUnique({
      where: { id: req.params.id }
    });
    if (!categoryExists) return res.status(404).json({ error: "Категория не найдена" });

    const word = await prisma.word.create({
      data: {
        de,
        ru,
        categoryId: req.params.id
      }
    });
    res.status(201).json(word);
  } catch (error) {
    console.error("POST /api/categories/:id/words error:", error);
    res.status(500).json({ error: "Ошибка при создании слова" });
  }
});

app.put("/api/words/:id", requireAdmin, async (req, res) => {
  const de = (req.body.de || "").trim();
  const ru = (req.body.ru || "").trim();
  if (!de || !ru) return res.status(400).json({ error: "Нужны оба поля: de и ru" });

  try {
    const word = await prisma.word.update({
      where: { id: req.params.id },
      data: { de, ru }
    });
    res.json(word);
  } catch (error) {
    console.error("PUT /api/words/:id error:", error);
    res.status(404).json({ error: "Слово не найдено" });
  }
});

app.delete("/api/words/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.word.delete({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (error) {
    console.error("DELETE /api/words/:id error:", error);
    res.status(404).json({ error: "Слово не найдено" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Тренажёр запущен: http://localhost:${PORT}`);
  console.log(`Админ-панель:      http://localhost:${PORT}/admin.html`);
  console.log(`Пароль админки считывается из файла .env`);
});
