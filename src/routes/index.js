const express = require("express");
const authRoutes = require("./authRoutes");
const categoryRoutes = require("./categoryRoutes");
const wordRoutes = require("./wordRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const router = express.Router();

router.use("/admin", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/words", wordRoutes);
router.use("/analytics", analyticsRoutes);

module.exports = router;
