const prisma = require("../db/prisma");
const wordImportService = require("./wordImportService");

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
      femininePlural: w.femininePlural,
      praeteritum: w.praeteritum,
      partizip2: w.partizip2,
      hilfsverb: w.hilfsverb,
      praesens: w.praesens,
      categoryId: w.categoryId,
      categoryName: w.category ? w.category.name : "Без категории"
    }));

    return {
      isDuplicate: matches.length > 0,
      matches
    };
  }

  async createWord(categoryId, de, ru, plural = null, feminine = null, femininePlural = null, force = false, extra = {}) {
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
    const cleanFemininePlural = femininePlural && String(femininePlural).trim() ? String(femininePlural).trim() : null;
    const cleanPraeteritum = extra.praeteritum && String(extra.praeteritum).trim() ? String(extra.praeteritum).trim() : null;
    const cleanPartizip2 = extra.partizip2 && String(extra.partizip2).trim() ? String(extra.partizip2).trim() : null;
    const cleanHilfsverb = extra.hilfsverb && String(extra.hilfsverb).trim() ? String(extra.hilfsverb).trim() : null;
    const cleanPraesens = extra.praesens && String(extra.praesens).trim() ? String(extra.praesens).trim() : null;
    const cleanPraesensIch = extra.praesensIch && String(extra.praesensIch).trim() ? String(extra.praesensIch).trim() : null;
    const cleanPraesensDu = extra.praesensDu && String(extra.praesensDu).trim() ? String(extra.praesensDu).trim() : null;
    const cleanPraesensEr = extra.praesensEr && String(extra.praesensEr).trim() ? String(extra.praesensEr).trim() : null;
    const cleanPraesensWir = extra.praesensWir && String(extra.praesensWir).trim() ? String(extra.praesensWir).trim() : null;
    const cleanPraesensIhr = extra.praesensIhr && String(extra.praesensIhr).trim() ? String(extra.praesensIhr).trim() : null;
    const cleanPraesensSie = extra.praesensSie && String(extra.praesensSie).trim() ? String(extra.praesensSie).trim() : null;

    return await prisma.word.create({
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
        categoryId
      }
    });
  }

  async updateWord(id, de, ru, plural = undefined, feminine = undefined, femininePlural = undefined, force = false, categoryId = undefined, extra = {}) {
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
    if (femininePlural !== undefined) {
      updateData.femininePlural = femininePlural && String(femininePlural).trim() ? String(femininePlural).trim() : null;
    }
    if (extra.praeteritum !== undefined) {
      updateData.praeteritum = extra.praeteritum && String(extra.praeteritum).trim() ? String(extra.praeteritum).trim() : null;
    }
    if (extra.partizip2 !== undefined) {
      updateData.partizip2 = extra.partizip2 && String(extra.partizip2).trim() ? String(extra.partizip2).trim() : null;
    }
    if (extra.hilfsverb !== undefined) {
      updateData.hilfsverb = extra.hilfsverb && String(extra.hilfsverb).trim() ? String(extra.hilfsverb).trim() : null;
    }
    if (extra.praesens !== undefined) {
      updateData.praesens = extra.praesens && String(extra.praesens).trim() ? String(extra.praesens).trim() : null;
    }
    if (extra.praesensIch !== undefined) {
      updateData.praesensIch = extra.praesensIch && String(extra.praesensIch).trim() ? String(extra.praesensIch).trim() : null;
    }
    if (extra.praesensDu !== undefined) {
      updateData.praesensDu = extra.praesensDu && String(extra.praesensDu).trim() ? String(extra.praesensDu).trim() : null;
    }
    if (extra.praesensEr !== undefined) {
      updateData.praesensEr = extra.praesensEr && String(extra.praesensEr).trim() ? String(extra.praesensEr).trim() : null;
    }
    if (extra.praesensWir !== undefined) {
      updateData.praesensWir = extra.praesensWir && String(extra.praesensWir).trim() ? String(extra.praesensWir).trim() : null;
    }
    if (extra.praesensIhr !== undefined) {
      updateData.praesensIhr = extra.praesensIhr && String(extra.praesensIhr).trim() ? String(extra.praesensIhr).trim() : null;
    }
    if (extra.praesensSie !== undefined) {
      updateData.praesensSie = extra.praesensSie && String(extra.praesensSie).trim() ? String(extra.praesensSie).trim() : null;
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
    return await wordImportService.bulkImportWords(items, defaultCategoryId, skipDuplicates);
  }
}

module.exports = new WordService();
