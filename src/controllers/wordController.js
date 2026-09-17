const wordService = require("../services/wordService");

class WordController {
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
    const de = (req.body.de || "").trim();
    const ru = (req.body.ru || "").trim();
    const plural = req.body.plural !== undefined ? (req.body.plural || "").trim() : null;
    const feminine = req.body.feminine !== undefined ? (req.body.feminine || "").trim() : null;
    const force = req.query.force === "true" || req.body.force === true;

    if (!de || !ru) {
      return res.status(400).json({ error: "Нужны оба поля: de и ru" });
    }

    try {
      const word = await wordService.createWord(req.params.id, de, ru, plural, feminine, force);
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
    const de = (req.body.de || "").trim();
    const ru = (req.body.ru || "").trim();
    const plural = req.body.plural !== undefined ? (req.body.plural || "").trim() : undefined;
    const feminine = req.body.feminine !== undefined ? (req.body.feminine || "").trim() : undefined;
    const force = req.query.force === "true" || req.body.force === true;

    if (!de || !ru) {
      return res.status(400).json({ error: "Нужны оба поля: de и ru" });
    }

    try {
      const word = await wordService.updateWord(req.params.id, de, ru, plural, feminine, force);
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
