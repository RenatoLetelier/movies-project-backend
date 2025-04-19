class MovieRepository {
  /**
   * @returns {Promise<Array>} Lista de todas las películas
   */
  async getAllMovies() {
    throw new Error("Method getAllMovies() not implemented");
  }

  /**
   * @param {number} id - ID de la película
   * @returns {Promise<Object>} Película encontrada
   */
  async getMovieById(id) {
    throw new Error("Method getMovieById() not implemented");
  }

  /**
   * @param {Object} movieData - Datos de la nueva película
   * @returns {Promise<Object>} Película creada
   */
  async createMovie(movieData) {
    throw new Error("Method createMovie() not implemented");
  }

  /**
   * @param {number} id - ID de la película
   * @param {Object} updatedData - Datos actualizados
   * @returns {Promise<Object>} Película actualizada
   */
  async updateMovie(id, updatedData) {
    throw new Error("Method updateMovie() not implemented");
  }

  /**
   * @param {number} id - ID de la película a eliminar
   * @returns {Promise<void>}
   */
  async deleteMovie(id) {
    throw new Error("Method deleteMovie() not implemented");
  }
}

module.exports = MovieRepository;
