require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(__dirname, "prisma", "dev.db")}`;
}

const prisma = new PrismaClient();
const DB_JSON_PATH = path.join(__dirname, "data", "db.json");

async function main() {
  if (!fs.existsSync(DB_JSON_PATH)) {
    console.log("[Migration] No data/db.json file found. Skipping JSON migration.");
    return;
  }

  console.log("[Migration] Reading data/db.json for safe data migration...");
  let rawData;
  try {
    rawData = fs.readFileSync(DB_JSON_PATH, "utf-8");
  } catch (err) {
    console.error("[Migration] Failed to read db.json:", err.message);
    return;
  }

  let data;
  try {
    data = JSON.parse(rawData);
  } catch (err) {
    console.error("[Migration] Invalid JSON in db.json:", err.message);
    return;
  }

  if (!data || !Array.isArray(data.categories)) {
    console.log("[Migration] No categories array found in db.json. Skipping.");
    return;
  }

  let catCount = 0;
  let wordCount = 0;

  for (const cat of data.categories) {
    if (!cat || !cat.name) continue;

    const catId = cat.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let dbCategory = await prisma.category.findUnique({
      where: { id: catId }
    });

    if (!dbCategory) {
      dbCategory = await prisma.category.findFirst({
        where: { name: cat.name }
      });
    }

    if (dbCategory) {
      dbCategory = await prisma.category.update({
        where: { id: dbCategory.id },
        data: { name: cat.name }
      });
    } else {
      dbCategory = await prisma.category.create({
        data: { id: catId, name: cat.name }
      });
      catCount++;
    }

    if (Array.isArray(cat.words)) {
      for (const word of cat.words) {
        if (!word || !word.de || !word.ru) continue;

        const wordId = word.id || `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const existingWord = await prisma.word.findFirst({
          where: {
            OR: [
              { id: wordId },
              { categoryId: dbCategory.id, de: word.de, ru: word.ru }
            ]
          }
        });

        if (!existingWord) {
          await prisma.word.create({
            data: {
              id: wordId,
              de: word.de,
              ru: word.ru,
              plural: word.plural || null,
              feminine: word.feminine || null,
              femininePlural: word.femininePlural || word.feminine_plural || null,
              categoryId: dbCategory.id
            }
          });
          wordCount++;
        } else {
          // Keep existing or enrich with plural/feminine/femininePlural if provided
          const updateData = {};
          if (word.plural && !existingWord.plural) updateData.plural = word.plural;
          if (word.feminine && !existingWord.feminine) updateData.feminine = word.feminine;
          if ((word.femininePlural || word.feminine_plural) && !existingWord.femininePlural) {
            updateData.femininePlural = word.femininePlural || word.feminine_plural;
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.word.update({
              where: { id: existingWord.id },
              data: updateData
            });
          }
        }
      }
    }
  }

  console.log(`[Migration] Done! Safely imported ${catCount} new categories and ${wordCount} new words into SQLite.`);
}

main()
  .catch((e) => {
    console.error("[Migration] Error during migration:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });