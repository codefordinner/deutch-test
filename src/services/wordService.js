const prisma = require("../db/prisma");

class WordService {
  async getAllWords() {
    if (!prisma) return [];
    try {
      return await prisma.word.findMany({
        include: { category: true },
        orderBy: { createdAt: "asc" }
      });
    } catch (err) {
      console.error("[WordService] getAllWords error:", err);
      return [];
    }
  }

  async checkDuplicates(de, ru, excludeId = null) {
    if (!prisma) return { isDuplicate: false, matches: [] };

    const normDe = (de || "").trim().toLowerCase();
    const normRu = (ru || "").trim().toLowerCase();

    if (!normDe && !normRu) return { isDuplicate: false, matches: [] };

    const allWords = await prisma.word.findMany({
      include: { category: true }
    });

    const matches = allWords.filter(w => {
      if (excludeId && w.id === excludeId) return false;
      const wDe = (w.de || "").trim().toLowerCase();
      const wRu = (w.ru || "").trim().toLowerCase();
      return (normDe && wDe === normDe) || (normRu && wRu === normRu);
    }).map(w => ({
      id: w.id,
      de: w.de,
      ru: w.ru,
      plural: w.plural,
      feminine: w.feminine,
      categoryId: w.categoryId,
      categoryName: w.category ? w.category.name : "Без категории"
    }));

    return {
      isDuplicate: matches.length > 0,
      matches
    };
  }

  async createWord(categoryId, de, ru, plural = null, feminine = null, force = false) {
    if (!prisma) throw new Error("База данных недоступна");

    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!categoryExists) {
      const error = new Error("Категория не найдена");
      error.status = 404;
      throw error;
    }

    if (!force) {
      const dupCheck = await this.checkDuplicates(de, ru);
      if (dupCheck.isDuplicate) {
        const error = new Error(`Такое слово уже существует в категории «${dupCheck.matches[0].categoryName}»`);
        error.status = 409;
        error.duplicate = true;
        error.matches = dupCheck.matches;
        throw error;
      }
    }

    const cleanPlural = plural && String(plural).trim() ? String(plural).trim() : null;
    const cleanFeminine = feminine && String(feminine).trim() ? String(feminine).trim() : null;

    return await prisma.word.create({
      data: {
        de,
        ru,
        plural: cleanPlural,
        feminine: cleanFeminine,
        categoryId
      }
    });
  }

  async updateWord(id, de, ru, plural = undefined, feminine = undefined, force = false, categoryId = undefined) {
    if (!prisma) throw new Error("База данных недоступна");

    if (de && ru && !force) {
      const dupCheck = await this.checkDuplicates(de, ru, id);
      if (dupCheck.isDuplicate) {
        const error = new Error(`Такое слово уже существует в категории «${dupCheck.matches[0].categoryName}»`);
        error.status = 409;
        error.duplicate = true;
        error.matches = dupCheck.matches;
        throw error;
      }
    }

    const updateData = {};
    if (de !== undefined && de !== null) updateData.de = de;
    if (ru !== undefined && ru !== null) updateData.ru = ru;
    if (plural !== undefined) {
      updateData.plural = plural && String(plural).trim() ? String(plural).trim() : null;
    }
    if (feminine !== undefined) {
      updateData.feminine = feminine && String(feminine).trim() ? String(feminine).trim() : null;
    }
    if (categoryId !== undefined && categoryId !== null) {
      updateData.categoryId = categoryId;
    }

    return await prisma.word.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });
  }

  async deleteWord(id) {
    if (!prisma) throw new Error("База данных недоступна");

    return await prisma.word.delete({
      where: { id }
    });
  }

  async moveWords(wordIds, targetCategoryId) {
    if (!prisma) throw new Error("База данных недоступна");

    const targetExists = await prisma.category.findUnique({
      where: { id: targetCategoryId }
    });
    if (!targetExists) {
      const error = new Error("Целевая категория не найдена");
      error.status = 404;
      throw error;
    }

    const ids = Array.isArray(wordIds) ? wordIds : [wordIds];
    const result = await prisma.word.updateMany({
      where: { id: { in: ids } },
      data: { categoryId: targetCategoryId }
    });

    return { count: result.count };
  }

  async bulkImportWords(items, defaultCategoryId = null, skipDuplicates = true) {
    if (!prisma) throw new Error("База данных недоступна");
    if (!Array.isArray(items) || items.length === 0) {
      return { importedCount: 0, skippedCount: 0, categoriesCreated: 0 };
    }

    // Cache categories map
    const categories = await prisma.category.findMany();
    const categoryMapByName = new Map();
    categories.forEach(c => categoryMapByName.set(c.name.trim().toLowerCase(), c.id));

    let defaultCatId = defaultCategoryId;
    if (!defaultCatId && categories.length > 0) {
      defaultCatId = categories[0].id;
    }

    // Cache existing words to check duplicates
    const allExistingWords = await prisma.word.findMany();
    const existingSet = new Set();
    allExistingWords.forEach(w => {
      existingSet.add(`${(w.de || "").trim().toLowerCase()}|||${(w.ru || "").trim().toLowerCase()}`);
    });

    let importedCount = 0;
    let skippedCount = 0;
    let categoriesCreated = 0;

    for (const item of items) {
      const de = (item.de || "").trim();
      const ru = (item.ru || "").trim();
      if (!de || !ru) {
        skippedCount++;
        continue;
      }

      const key = `${de.toLowerCase()}|||${ru.toLowerCase()}`;
      if (skipDuplicates && existingSet.has(key)) {
        skippedCount++;
        continue;
      }

      let catId = defaultCatId;
      const catName = (item.categoryName || item.category || "").trim();
      if (catName) {
        const catKey = catName.toLowerCase();
        if (categoryMapByName.has(catKey)) {
          catId = categoryMapByName.get(catKey);
        } else {
          // Create category on the fly
          const newCat = await prisma.category.create({ data: { name: catName } });
          categoryMapByName.set(catKey, newCat.id);
          catId = newCat.id;
          categoriesCreated++;
        }
      }

      if (!catId) {
        // Create default category "Импортированные" if no categories exist
        const defaultCat = await prisma.category.create({ data: { name: "Импортированные" } });
        categoryMapByName.set("импортированные", defaultCat.id);
        catId = defaultCat.id;
        defaultCatId = defaultCat.id;
        categoriesCreated++;
      }

      const cleanPlural = item.plural && String(item.plural).trim() ? String(item.plural).trim() : null;
      const cleanFeminine = item.feminine && String(item.feminine).trim() ? String(item.feminine).trim() : null;

      await prisma.word.create({
        data: {
          de,
          ru,
          plural: cleanPlural,
          feminine: cleanFeminine,
          categoryId: catId
        }
      });

      existingSet.add(key);
      importedCount++;
    }

    return { importedCount, skippedCount, categoriesCreated };
  }
}

module.exports = new WordService();
