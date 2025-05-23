const config = require("../config");

let MoviesRepository;

if (config.DB_TYPE === "mysql") {
  MoviesRepository =
    new (require("../repositories/MoviesRepository/MoviesRepository.mysql"))();
} else if (config.DB_TYPE === "mongodb") {
  MoviesRepository =
    new (require("../repositories/MoviesRepository/MoviesRepository.mongodb"))();
}

module.exports = {
  getAllMovies: async () => await MoviesRepository.getAllMovies(),
  getMovieByTitle: async (title) =>
    await MoviesRepository.getMovieByTitle(title),
  createMovie: async (data) => await MoviesRepository.createMovie(data),
  updateMovie: async (title, data) =>
    await MoviesRepository.updateMovie(title, data),
  deleteMovie: async (title) => await MoviesRepository.deleteMovie(title),
  getMoviePathByTitle: async (title) =>
    await MoviesRepository.getMoviePathByTitle(title),
};
