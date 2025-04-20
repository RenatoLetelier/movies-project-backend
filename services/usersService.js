const config = require("../config");

let UsersRepository;

if (config.DB_TYPE === "mysql") {
  UsersRepository = new (require("../repositories/UsersRepository.mysql"))();
} else if (config.DB_TYPE === "mongodb") {
  UsersRepository = new (require("../repositories/UsersRepository.mongodb"))();
}

module.exports = {
  getAllUsers: async () => await UsersRepository.getAllUsers(),
  getUserById: async (id) => await UsersRepository.getUserById(id),
  createUser: async (data) => await UsersRepository.createUser(data),
  updateUser: async (id, data) => await UsersRepository.updateUser(id, data),
  deleteUser: async (id) => await UsersRepository.deleteUser(id),
  getUserPathById: async (id) => await UsersRepository.getUserPathById(id),
};
