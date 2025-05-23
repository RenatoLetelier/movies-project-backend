const express = require("express");
const router = express.Router();
const moviesController = require("../controllers/moviesController");

router.get("/", moviesController.getAllMovies);
router.get("/:title", moviesController.getMovieByTitle);
router.post("/", moviesController.createMovie);
router.put("/:title", moviesController.updateMovie);
router.delete("/:title", moviesController.deleteMovie);

router.get("/watch/:title", moviesController.streamMovieByTitle);

module.exports = router;
