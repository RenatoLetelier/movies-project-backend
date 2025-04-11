const express = require('express');
const router = express.Router();
const { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie, streamMovieByTitle } = require('../controllers/moviesController');

router.get('/', getAllMovies);
router.get('/:id', getMovieById);
router.get('/watch/:name', streamMovieByTitle);
router.post('/', createMovie);
router.put('/:id', updateMovie);
router.delete('/:id', deleteMovie);

module.exports = router;
