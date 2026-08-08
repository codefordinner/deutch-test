const express = require("express");
const authRoutes = require("./authRoutes");
const categoryRoutes = require("./categoryRoutes");
const wordRoutes = require("./wordRoutes");

const router = express.Router();

router.use("/admin", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/words", wordRoutes);

module.exports = router;
