const config = require('../config');

let MoviesRepository;

if (config.DB_TYPE === 'mysql') {
  MoviesRepository = new (require('../repositories/MoviesRepository.mysql'))();
} else if (config.DB_TYPE === 'mongodb') {
  MoviesRepository = new (require('../repositories/MoviesRepository.mongodb'))();
}

module.exports = {
  getAllMovies: async () => await MoviesRepository.getAllMovies(),
  getMovieById: async (id) => await MoviesRepository.getMovieById(id),
  createMovie: async (data) => await MoviesRepository.createMovie(data),
  updateMovie: async (id, data) => await MoviesRepository.updateMovie(id, data),
  deleteMovie: async (id) => await MoviesRepository.deleteMovie(id),
  getMoviePathById: async (id) => await MoviesRepository.getMoviePathById(id)
};