const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateToken } = require("../middlewares/validateToken");

router.post("/register", authController.signup);
router.post("/login", authController.signin);
router.get("/profile", validateToken, authController.getProfile);

module.exports = router;
