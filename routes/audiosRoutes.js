const express = require("express");
const router = express.Router();
const audiosController = require("../controllers/audiosController");

router.get("/", audiosController.getAllAudios);
router.get("/:id", audiosController.getAudioById);
router.post("/", audiosController.createAudio);
router.put("/:id", audiosController.updateAudio);
router.delete("/:id", audiosController.deleteAudio);

router.get("/stream/:id", audiosController.streamAudioById);

module.exports = router;
