const express = require("express");
const router = express.Router();

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const moviesRoutes = require("./routes/moviesRoutes");
const audiosRoutes = require("./routes/audiosRoutes");
const subtitlesRoutes = require("./routes/subtitlesRoutes");
const photosRoutes = require("./routes/photosRoutes");

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/movies", moviesRoutes);
router.use("/audios", audiosRoutes);
router.use("/subtitles", subtitlesRoutes);
router.use("/photos", photosRoutes);

module.exports = router;
