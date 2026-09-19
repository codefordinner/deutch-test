/**
 * Request Validation Middleware
 */

function validateCategory(req, res, next) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    return res.status(400).json({ error: "Название категории обязательно" });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: "Название категории не должно превышать 100 символов" });
  }
  req.body.name = name;
  next();
}

function cleanString(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str.length > 0 ? str : null;
}

function validateWord(req, res, next) {
  const categoryId = req.params.id || req.body.categoryId;
  const de = cleanString(req.body.de);
  const ru = cleanString(req.body.ru);

  if (!categoryId) {
    return res.status(400).json({ error: "Категория обязательна" });
  }
  if (!de || !ru) {
    return res.status(400).json({ error: "Нужны оба поля: de и ru" });
  }

  req.validatedWord = {
    categoryId,
    de,
    ru,
    plural: cleanString(req.body.plural),
    feminine: cleanString(req.body.feminine),
    femininePlural: cleanString(req.body.femininePlural),
    praeteritum: cleanString(req.body.praeteritum),
    partizip2: cleanString(req.body.partizip2),
    hilfsverb: cleanString(req.body.hilfsverb),
    praesens: cleanString(req.body.praesens),
    praesensIch: cleanString(req.body.praesensIch),
    praesensDu: cleanString(req.body.praesensDu),
    praesensEr: cleanString(req.body.praesensEr),
    praesensWir: cleanString(req.body.praesensWir),
    praesensIhr: cleanString(req.body.praesensIhr),
    praesensSie: cleanString(req.body.praesensSie),
    force: req.query.force === "true" || req.body.force === true
  };

  next();
}

function validateAuth(req, res, next) {
  const password = typeof req.body.password === "string" ? req.body.password.trim() : "";
  if (!password) {
    return res.status(400).json({ error: "Пароль обязателен" });
  }
  next();
}

module.exports = {
  validateCategory,
  validateWord,
  validateAuth
};
