const prisma = require("../db/prisma");
const fs = require("fs");
const path = require("path");
const config = require("../config");

class CategoryService {
  async getAllCategories() {
    if (prisma) {
      try {
        const categories = await prisma.category.findMany({
          include: {
            words: true
          },
          orderBy: {
            createdAt: "asc"
          }
        });
        return categories;
      } catch (err) {
        console.error("[CategoryService] Prisma findMany error:", err);
      }
    }

    // Fallback to db.json if Prisma is unavailable
    try {
      const dbJsonPath = path.join(config.dataDir, "db.json");
      if (fs.existsSync(dbJsonPath)) {
        const raw = fs.readFileSync(dbJsonPath, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed.categories || [];
      }
    } catch (e) {
      console.error("[CategoryService] Fallback JSON read error:", e);
    }

    return [];
  }

  async createCategory(name) {
    if (!prisma) {
      throw new Error("База данных недоступна");
    }
    return await prisma.category.create({
      data: { name },
      include: { words: true }
    });
  }

  async updateCategory(id, name) {
    if (!prisma) {
      throw new Error("База данных недоступна");
    }
    return await prisma.category.update({
      where: { id },
      data: { name },
      include: { words: true }
    });
  }

  async deleteCategory(id) {
    if (!prisma) {
      throw new Error("База данных недоступна");
    }
    return await prisma.category.delete({
      where: { id }
    });
  }
}

module.exports = new CategoryService();
