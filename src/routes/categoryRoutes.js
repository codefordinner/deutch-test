const express = require("express");
const categoryController = require("../controllers/categoryController");
const wordController = require("../controllers/wordController");
const { requireAdmin } = require("../middlewares/authMiddleware");
const { validateCategory, validateWord } = require("../middlewares/validator");

const router = express.Router();

router.get("/", (req, res, next) => categoryController.getCategories(req, res, next));
router.get("/:id", (req, res, next) => categoryController.getCategoryById(req, res, next));
router.post("/", requireAdmin, validateCategory, (req, res, next) => categoryController.createCategory(req, res, next));
router.put("/:id", requireAdmin, validateCategory, (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete("/:id", requireAdmin, (req, res, next) => categoryController.deleteCategory(req, res, next));

// Sub-resource route for words inside a category
router.post("/:id/words", requireAdmin, validateWord, (req, res, next) => wordController.createWord(req, res, next));

module.exports = router;
