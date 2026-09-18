const prisma = require("../db/prisma");

class WordImportService {
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
      const cleanFemininePlural = (item.femininePlural || item.feminine_plural) && String(item.femininePlural || item.feminine_plural).trim() ? String(item.femininePlural || item.feminine_plural).trim() : null;
      const cleanPraeteritum = item.praeteritum && String(item.praeteritum).trim() ? String(item.praeteritum).trim() : null;
      const cleanPartizip2 = item.partizip2 && String(item.partizip2).trim() ? String(item.partizip2).trim() : null;
      const cleanHilfsverb = item.hilfsverb && String(item.hilfsverb).trim() ? String(item.hilfsverb).trim() : null;
      const cleanPraesens = item.praesens && String(item.praesens).trim() ? String(item.praesens).trim() : null;
      const cleanPraesensIch = item.praesensIch && String(item.praesensIch).trim() ? String(item.praesensIch).trim() : null;
      const cleanPraesensDu = item.praesensDu && String(item.praesensDu).trim() ? String(item.praesensDu).trim() : null;
      const cleanPraesensEr = item.praesensEr && String(item.praesensEr).trim() ? String(item.praesensEr).trim() : null;
      const cleanPraesensWir = item.praesensWir && String(item.praesensWir).trim() ? String(item.praesensWir).trim() : null;
      const cleanPraesensIhr = item.praesensIhr && String(item.praesensIhr).trim() ? String(item.praesensIhr).trim() : null;
      const cleanPraesensSie = item.praesensSie && String(item.praesensSie).trim() ? String(item.praesensSie).trim() : null;

      await prisma.word.create({
        data: {
          de,
          ru,
          plural: cleanPlural,
          feminine: cleanFeminine,
          femininePlural: cleanFemininePlural,
          praeteritum: cleanPraeteritum,
          partizip2: cleanPartizip2,
          hilfsverb: cleanHilfsverb,
          praesens: cleanPraesens,
          praesensIch: cleanPraesensIch,
          praesensDu: cleanPraesensDu,
          praesensEr: cleanPraesensEr,
          praesensWir: cleanPraesensWir,
          praesensIhr: cleanPraesensIhr,
          praesensSie: cleanPraesensSie,
          categoryId: catId
        }
      });

      existingSet.add(key);
      importedCount++;
    }

    return { importedCount, skippedCount, categoriesCreated };
  }
}

module.exports = new WordImportService();
