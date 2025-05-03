const express = require("express");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const moviesRoutes = require("./routes/moviesRoutes");
const photosRoutes = require("./routes/photosRoutes");
const subtitlesRoutes = require("./routes/subtitlesRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/movies", moviesRoutes);
router.use("/photos", photosRoutes);
router.use("/subtitles", subtitlesRoutes);

module.exports = router;
