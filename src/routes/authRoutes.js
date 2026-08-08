const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/login", (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.get("/status", (req, res) => authController.getStatus(req, res));

module.exports = router;
