const express = require("express");
const wordController = require("../controllers/wordController");
const { requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", (req, res, next) => wordController.getAllWords(req, res, next));
router.post("/", requireAdmin, (req, res, next) => wordController.createWord(req, res, next));
router.get("/check-duplicate", requireAdmin, (req, res, next) => wordController.checkDuplicate(req, res, next));
router.post("/bulk-import", requireAdmin, (req, res, next) => wordController.bulkImport(req, res, next));
router.put("/:id", requireAdmin, (req, res, next) => wordController.updateWord(req, res, next));
router.delete("/:id", requireAdmin, (req, res, next) => wordController.deleteWord(req, res, next));
router.post("/move", requireAdmin, (req, res, next) => wordController.moveWords(req, res, next));

module.exports = router;
