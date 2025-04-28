const express = require("express");
const router = express.Router();
const subtitlesController = require("../controllers/subtitlesController");

router.get("/", subtitlesController.getAllSubtitles);
router.get("/:id", subtitlesController.getSubtitleById);
router.post("/", subtitlesController.createSubtitle);
router.put("/:id", subtitlesController.updateSubtitle);
router.delete("/:id", subtitlesController.deleteSubtitle);

router.get("/stream/:id", subtitlesController.streamSubtitleById);

module.exports = router;
