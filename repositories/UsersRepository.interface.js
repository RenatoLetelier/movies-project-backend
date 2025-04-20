class UserRepository {
  /**
   * @returns {Promise<Array>} Lista de todos los usuarios
   */
  async getAllUsers() {
    throw new Error("Method getAllUsers() not implemented");
  }

  /**
   * @param {number} id - ID del usuario
   * @returns {Promise<Object>} Usuario encontrado
   */
  async getUserById(id) {
    throw new Error("Method getUserById() not implemented");
  }

  /**
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async createUser(userData) {
    throw new Error("Method createUser() not implemented");
  }

  /**
   * @param {number} id - ID del usuario
   * @param {Object} updatedData - Datos actualizados
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateUser(id, updatedData) {
    throw new Error("Method updateUser() not implemented");
  }

  /**
   * @param {number} id - ID del usuario a eliminar
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    throw new Error("Method deleteUser() not implemented");
  }
}

module.exports = UserRepository;
