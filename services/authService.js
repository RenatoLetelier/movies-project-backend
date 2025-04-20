const config = require("../config");

let AuthRepository;

if (config.DB_TYPE === "mysql") {
  AuthRepository = new (require("../repositories/AuthRepository.mysql"))();
} else if (config.DB_TYPE === "mongodb") {
  AuthRepository = new (require("../repositories/AuthRepository.mongodb"))();
}

module.exports = {
  signup: async (data) => await AuthRepository.signup(data),
  signin: async (data) => await AuthRepository.signin(data),
};
