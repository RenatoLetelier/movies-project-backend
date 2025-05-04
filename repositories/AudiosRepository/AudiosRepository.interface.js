class AudioRepository {
  /**
   * @returns {Promise<Array>} Lista de todos los audios
   */
  async getAllAudios() {
    throw new Error("Method getAllAudios() not implemented");
  }

  /**
   * @param {number} id - ID del audio
   * @returns {Promise<Object>} Audio encontrado
   */
  async getAudioById(id) {
    throw new Error("Method getAudioById() not implemented");
  }

  /**
   * @param {Object} movieData - Datos del nuevo audio
   * @returns {Promise<Object>} Audio creado
   */
  async createAudio(movieData) {
    throw new Error("Method createAudio() not implemented");
  }

  /**
   * @param {number} id - ID del audio
   * @param {Object} updatedData - Datos actualizados
   * @returns {Promise<Object>} Audio actualizado
   */
  async updateAudio(id, updatedData) {
    throw new Error("Method updateAudio() not implemented");
  }

  /**
   * @param {number} id - ID del audio a eliminar
   * @returns {Promise<void>}
   */
  async deleteAudio(id) {
    throw new Error("Method deleteAudio() not implemented");
  }
}

module.exports = AudioRepository;
