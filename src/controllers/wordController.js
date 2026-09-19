const wordService = require("../services/wordService");

class WordController {
  async getAllWords(req, res, next) {
    try {
      const words = await wordService.getAllWords();
      res.json(words);
    } catch (error) {
      next(error);
    }
  }

  async checkDuplicate(req, res, next) {
    const { de, ru, excludeId } = req.query;
    try {
      const result = await wordService.checkDuplicates(de, ru, excludeId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createWord(req, res, next) {
    const data = req.validatedWord || {
      categoryId: req.params.id || req.body.categoryId,
      de: (req.body.de || "").trim(),
      ru: (req.body.ru || "").trim(),
      plural: req.body.plural !== undefined ? (req.body.plural || "").trim() || null : null,
      feminine: req.body.feminine !== undefined ? (req.body.feminine || "").trim() || null : null,
      femininePlural: req.body.femininePlural !== undefined ? (req.body.femininePlural || "").trim() || null : null,
      praeteritum: req.body.praeteritum !== undefined ? (req.body.praeteritum || "").trim() || null : null,
      partizip2: req.body.partizip2 !== undefined ? (req.body.partizip2 || "").trim() || null : null,
      hilfsverb: req.body.hilfsverb !== undefined ? (req.body.hilfsverb || "").trim() || null : null,
      praesens: req.body.praesens !== undefined ? (req.body.praesens || "").trim() || null : null,
      praesensIch: req.body.praesensIch !== undefined ? (req.body.praesensIch || "").trim() || null : null,
      praesensDu: req.body.praesensDu !== undefined ? (req.body.praesensDu || "").trim() || null : null,
      praesensEr: req.body.praesensEr !== undefined ? (req.body.praesensEr || "").trim() || null : null,
      praesensWir: req.body.praesensWir !== undefined ? (req.body.praesensWir || "").trim() || null : null,
      praesensIhr: req.body.praesensIhr !== undefined ? (req.body.praesensIhr || "").trim() || null : null,
      praesensSie: req.body.praesensSie !== undefined ? (req.body.praesensSie || "").trim() || null : null,
      force: req.query.force === "true" || req.body.force === true
    };

    if (!data.categoryId) {
      return res.status(400).json({ error: "Категория обязательна" });
    }

    if (!data.de || !data.ru) {
      return res.status(400).json({ error: "Нужны оба поля: de и ru" });
    }

    try {
      const word = await wordService.createWord(
        data.categoryId,
        data.de,
        data.ru,
        data.plural,
        data.feminine,
        data.femininePlural,
        data.force,
        {
          praeteritum: data.praeteritum,
          partizip2: data.partizip2,
          hilfsverb: data.hilfsverb,
          praesens: data.praesens,
          praesensIch: data.praesensIch,
          praesensDu: data.praesensDu,
          praesensEr: data.praesensEr,
          praesensWir: data.praesensWir,
          praesensIhr: data.praesensIhr,
          praesensSie: data.praesensSie
        }
      );
      res.status(201).json(word);
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ error: error.message });
      }
      if (error.status === 409) {
        return res.status(409).json({
          error: error.message,
          duplicate: true,
          matches: error.matches
        });
      }
      next(error);
    }
  }

  async updateWord(req, res, next) {
    const de = req.body.de !== undefined ? (req.body.de || "").trim() : undefined;
    const ru = req.body.ru !== undefined ? (req.body.ru || "").trim() : undefined;
    const plural = req.body.plural !== undefined ? (req.body.plural || "").trim() : undefined;
    const feminine = req.body.feminine !== undefined ? (req.body.feminine || "").trim() : undefined;
    const femininePlural = req.body.femininePlural !== undefined ? (req.body.femininePlural || "").trim() : undefined;
    const praeteritum = req.body.praeteritum !== undefined ? (req.body.praeteritum || "").trim() : undefined;
    const partizip2 = req.body.partizip2 !== undefined ? (req.body.partizip2 || "").trim() : undefined;
    const hilfsverb = req.body.hilfsverb !== undefined ? (req.body.hilfsverb || "").trim() : undefined;
    const praesens = req.body.praesens !== undefined ? (req.body.praesens || "").trim() : undefined;
    const praesensIch = req.body.praesensIch !== undefined ? (req.body.praesensIch || "").trim() : undefined;
    const praesensDu = req.body.praesensDu !== undefined ? (req.body.praesensDu || "").trim() : undefined;
    const praesensEr = req.body.praesensEr !== undefined ? (req.body.praesensEr || "").trim() : undefined;
    const praesensWir = req.body.praesensWir !== undefined ? (req.body.praesensWir || "").trim() : undefined;
    const praesensIhr = req.body.praesensIhr !== undefined ? (req.body.praesensIhr || "").trim() : undefined;
    const praesensSie = req.body.praesensSie !== undefined ? (req.body.praesensSie || "").trim() : undefined;
    const categoryId = req.body.categoryId;
    const force = req.query.force === "true" || req.body.force === true;

    if (de === "" || ru === "") {
      return res.status(400).json({ error: "Поля de и ru не могут быть пустыми" });
    }

    try {
      const word = await wordService.updateWord(req.params.id, de, ru, plural, feminine, femininePlural, force, categoryId, {
        praeteritum,
        partizip2,
        hilfsverb,
        praesens,
        praesensIch,
        praesensDu,
        praesensEr,
        praesensWir,
        praesensIhr,
        praesensSie
      });
      res.json(word);
    } catch (error) {
      if (error.status === 409) {
        return res.status(409).json({
          error: error.message,
          duplicate: true,
          matches: error.matches
        });
      }
      res.status(404).json({ error: "Слово не найдено" });
    }
  }

  async deleteWord(req, res, next) {
    try {
      await wordService.deleteWord(req.params.id);
      res.status(204).end();
    } catch (error) {
      res.status(404).json({ error: "Слово не найдено" });
    }
  }

  async moveWords(req, res, next) {
    const { wordIds, targetCategoryId } = req.body;
    if (!targetCategoryId || (!Array.isArray(wordIds) && typeof wordIds !== "string")) {
      return res.status(400).json({ error: "Укажите wordIds и targetCategoryId" });
    }

    const ids = Array.isArray(wordIds) ? wordIds : [wordIds];
    if (ids.length === 0) {
      return res.status(400).json({ error: "Список слов пуст" });
    }

    try {
      const result = await wordService.moveWords(ids, targetCategoryId);
      res.json({ ok: true, count: result.count });
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async bulkImport(req, res, next) {
    const { items, defaultCategoryId, skipDuplicates } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Массив слов обязателен" });
    }

    try {
      const result = await wordService.bulkImportWords(items, defaultCategoryId, skipDuplicates !== false);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WordController();
