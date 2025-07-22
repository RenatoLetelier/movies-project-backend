const db = require("../../models/SQL_xampp");
const AuthRepository = require("./AuthRepository.interface");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthRepositoryMySQL extends AuthRepository {
  //SIGNUP
  async signup(data) {
    try {
      const [existingUsers] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [data.username]
      );
      if (existingUsers.length > 0) {
        return { error: "El usuario ya existe" };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const [result] = await db.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [data.username, data.email, hashedPassword]
      );
      const userId = result.insertId;

      const token = jwt.sign(
        { id: userId, username: data.username },
        process.env.JWT_SECRET,
        { expiresIn: "23h" }
      );

      const newUser = {
        id: userId,
        username: data.username,
        email: data.email,
      };

      return { message: "Registro de sesión exitoso", token, newUser };
    } catch (error) {
      return { message: "Error al crear usuario" };
    }
  }

  //SIGNIN
  async signin(data) {
    try {
      const [results] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [data.username]
      );

      if (results.length === 0) {
        return { error: "Usuario no encontrado" };
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(data.password, user.password);

      if (!isMatch) {
        return { error: "Contraseña incorrecta" };
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "23h" }
      );

      const result = {
        message: "Inicio de sesión exitoso",
        username: user.username,
        email: user.email,
      };

      return { token, result };
    } catch (error) {
      res.status(500).json({ error: "Error en el login" });
    }
  }

  //GET PROFILE
  async getProfile(id) {
    try {
      const [results] = await db.query(
        "SELECT username, email FROM users WHERE id = ?",
        [id]
      );

      return results;
    } catch (error) {
      res.status(500).json({ error: "Error al obtener perfil" });
    }
  }
}

module.exports = AuthRepositoryMySQL;
