require("dotenv").config();

const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "data", "db.json");

// Если SESSION_SECRET не задан в .env, генерируется случайный (для локальной разработки)
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

// ---------- helpers ----------

function readDb() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function newId(prefix) {
  return prefix + "_" + crypto.randomBytes(6).toString("hex");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Требуется вход в админ-панель" });
}

// ---------- auth ----------

app.post("/api/admin/login", (req, res) => {
  const password = req.body.password || "";
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Проверка на случай, если забыли задать пароль в .env
  if (!adminPassword) {
    console.error("ОШИБКА: ADMIN_PASSWORD не задан в .env файле!");
    return res.status(500).json({ error: "Ошибка конфигурации сервера" });
  }

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

// Protect the admin panel page itself: only serve it if logged in,
// otherwise send to the login page.
app.get("/admin.html", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.sendFile(path.join(__dirname, "public", "admin.html"));
  }
  return res.redirect("/admin-login.html");
});

// static files (css/js/images + index.html, admin-login.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ---------- categories (read: public, write: admin only) ----------

app.get("/api/categories", (req, res) => {
  const db = readDb();
  res.json(db.categories);
});

app.post("/api/categories", requireAdmin, (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Название категории обязательно" });
  const db = readDb();
  const category = { id: newId("cat"), name, words: [] };
  db.categories.push(category);
  writeDb(db);
  res.status(201).json(category);
});

app.put("/api/categories/:id", requireAdmin, (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Название категории обязательно" });
  const db = readDb();
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: "Категория не найдена" });
  cat.name = name;
  writeDb(db);
  res.json(cat);
});

app.delete("/api/categories/:id", requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Категория не найдена" });
  db.categories.splice(idx, 1);
  writeDb(db);
  res.status(204).end();
});

// ---------- words (write: admin only) ----------

app.post("/api/categories/:id/words", requireAdmin, (req, res) => {
  const de = (req.body.de || "").trim();
  const ru = (req.body.ru || "").trim();
  if (!de || !ru) return res.status(400).json({ error: "Нужны оба поля: de и ru" });
  const db = readDb();
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: "Категория не найдена" });
  const word = { id: newId("w"), de, ru };
  cat.words.push(word);
  writeDb(db);
  res.status(201).json(word);
});

app.put("/api/words/:id", requireAdmin, (req, res) => {
  const de = (req.body.de || "").trim();
  const ru = (req.body.ru || "").trim();
  if (!de || !ru) return res.status(400).json({ error: "Нужны оба поля: de и ru" });
  const db = readDb();
  for (const cat of db.categories) {
    const word = cat.words.find((w) => w.id === req.params.id);
    if (word) {
      word.de = de;
      word.ru = ru;
      writeDb(db);
      return res.json(word);
    }
  }
  res.status(404).json({ error: "Слово не найдено" });
});

app.delete("/api/words/:id", requireAdmin, (req, res) => {
  const db = readDb();
  for (const cat of db.categories) {
    const idx = cat.words.findIndex((w) => w.id === req.params.id);
    if (idx !== -1) {
      cat.words.splice(idx, 1);
      writeDb(db);
      return res.status(204).end();
    }
  }
  res.status(404).json({ error: "Слово не найдено" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Тренажёр запущен: http://localhost:${PORT}`);
  console.log(`Админ-панель:      http://localhost:${PORT}/admin.html`);
  console.log(`Пароль админки считывается из файла .env`);
});