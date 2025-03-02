const express = require('express');
const router = express.Router();
const { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie } = require('../controllers/moviesController');

router.get('/movies', getAllMovies);
router.get('/movie/:id', getMovieById);
//router.get('/watch/:id', streamMovie);
router.post('/movie', createMovie);
router.put('/movie/:id', updateMovie);
router.delete('/movie/:id', deleteMovie);

module.exports = router;
