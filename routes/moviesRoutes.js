const express = require("express");
const router = express.Router();
const moviesController = require("../controllers/moviesController");
const { validateToken } = require("../middlewares/validateToken");

router.get("/", validateToken, moviesController.getAllMovies);
router.get("/:title", moviesController.getMovieByTitle);
router.post("/", moviesController.createMovie);
router.put("/:title", moviesController.updateMovie);
router.delete("/:title", moviesController.deleteMovie);

router.get("/watch/:title", moviesController.streamMovieByTitle);

module.exports = router;
