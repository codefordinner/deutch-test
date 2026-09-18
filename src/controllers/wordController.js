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
    const categoryId = req.params.id || req.body.categoryId;
    const de = (req.body.de || "").trim();
    const ru = (req.body.ru || "").trim();
    const plural = req.body.plural !== undefined ? (req.body.plural || "").trim() : null;
    const feminine = req.body.feminine !== undefined ? (req.body.feminine || "").trim() : null;
    const femininePlural = req.body.femininePlural !== undefined ? (req.body.femininePlural || "").trim() : null;
    const praeteritum = req.body.praeteritum !== undefined ? (req.body.praeteritum || "").trim() : null;
    const partizip2 = req.body.partizip2 !== undefined ? (req.body.partizip2 || "").trim() : null;
    const hilfsverb = req.body.hilfsverb !== undefined ? (req.body.hilfsverb || "").trim() : null;
    const praesens = req.body.praesens !== undefined ? (req.body.praesens || "").trim() : null;
    const force = req.query.force === "true" || req.body.force === true;

    if (!categoryId) {
      return res.status(400).json({ error: "Категория обязательна" });
    }

    if (!de || !ru) {
      return res.status(400).json({ error: "Нужны оба поля: de и ru" });
    }

    try {
      const word = await wordService.createWord(categoryId, de, ru, plural, feminine, femininePlural, force, {
        praeteritum,
        partizip2,
        hilfsverb,
        praesens
      });
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
        praesens
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
