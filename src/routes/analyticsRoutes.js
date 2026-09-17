const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public tracking endpoint
router.post("/track", (req, res, next) => analyticsController.trackEvent(req, res, next));

// Admin protected endpoints
router.get("/stats", requireAdmin, (req, res, next) => analyticsController.getStats(req, res, next));
router.get("/logs", requireAdmin, (req, res, next) => analyticsController.getLogs(req, res, next));
router.delete("/logs", requireAdmin, (req, res, next) => analyticsController.clearLogs(req, res, next));

module.exports = router;
