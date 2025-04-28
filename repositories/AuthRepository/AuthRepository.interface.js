class AuthRepository {
  /**
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async signup(userData) {
    throw new Error("Method signup() not implemented");
  }

  /**
   * @param {Object} userData - Credenciales del usuario
   * @returns {Promise<Object>} Usuario ingresado
   */
  async signin(userData) {
    throw new Error("Method signin() not implemented");
  }
}

module.exports = AuthRepository;
