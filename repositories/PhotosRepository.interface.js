class PhotoRepository {
    /**
     * @returns {Promise<Array>} Lista de todas las fotos
     */
    async getAllPhotos() {
      throw new Error("Method getAllPhotos() not implemented");
    }
  
    /**
     * @param {number} id - ID de la foto
     * @returns {Promise<Object>} Foto encontrada
     */
    async getPhotoById(id) {
      throw new Error("Method getPhotoById() not implemented");
    }
  
    /**
     * @param {Object} photoData - Datos de la nueva Foto
     * @returns {Promise<Object>} Foto creada
     */
    async createPhoto(photoData) {
      throw new Error("Method createPhoto() not implemented");
    }
  
    /**
     * @param {number} id - ID de la Foto
     * @param {Object} updatedData - Datos actualizados
     * @returns {Promise<Object>} Foto actualizada
     */
    async updatePhoto(id, updatedData) {
      throw new Error("Method updatePhoto() not implemented");
    }
  
    /**
     * @param {number} id - ID de la Foto a eliminar
     * @returns {Promise<void>}
     */
    async deletePhoto(id) {
      throw new Error("Method deletePhoto() not implemented");
    }
  }
  
  module.exports = PhotoRepository;