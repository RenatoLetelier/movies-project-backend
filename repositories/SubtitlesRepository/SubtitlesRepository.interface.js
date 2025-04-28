class SubtitleRepository {
  /**
   * @returns {Promise<Array>} Lista de todos los subtitulos
   */
  async getAllSubtitles() {
    throw new Error("Method getAllSubtitles() not implemented");
  }

  /**
   * @param {number} id - ID del subtitulo
   * @returns {Promise<Object>} Subtitulo encontrado
   */
  async getSubtitleById(id) {
    throw new Error("Method getSubtitleById() not implemented");
  }

  /**
   * @param {Object} subtitleData - Datos del nuevo subtitulo
   * @returns {Promise<Object>} Subtitulo creado
   */
  async createSubtitle(subtitleData) {
    throw new Error("Method createSubtitle() not implemented");
  }

  /**
   * @param {number} id - ID del subtitulo
   * @param {Object} updatedData - Datos actualizados
   * @returns {Promise<Object>} Subtitulo actualizado
   */
  async updateSubtitle(id, updatedData) {
    throw new Error("Method updateSubtitle() not implemented");
  }

  /**
   * @param {number} id - ID del subtitulo a eliminar
   * @returns {Promise<void>}
   */
  async deleteSubtitle(id) {
    throw new Error("Method deleteSubtitle() not implemented");
  }
}

module.exports = SubtitleRepository;
