const db = require("../models/Users_db");
const UserRepository = require("./UsersRepository.interface");
const bcrypt = require("bcryptjs");

class UserRepositoryMySQL extends UserRepository {
  //GET ALL USERS
  async getAllUsers() {
    const query = "SELECT * FROM users";
    const [rows] = await db.query(query);
    return rows;
  }

  //GET ONE USER
  async getUserById(id) {
    const query = `SELECT id, username, email, createdAt, rol FROM users WHERE id = ?;`;

    const [results] = await db.query(query, id);
    if (results.length === 0) return null;

    const user = results[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      rol: user.rol,
    };
  }

  //CREATE USER
  async createUser(data) {
    const { username, email, password } = data;

    if (!username || !password) {
      return { message: "Username y password son requeridos" };
    }

    try {
      const [existingUsers] = await db.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      if (existingUsers.length > 0) {
        return { message: "El usuario ya existe" };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword]
      );

      return { message: "Usuario creado con éxito" };
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);
      return { message: "Error al crear usuario" };
    }
  }

  //UPDATE USER
  async updateUser(userId, data) {
    const { username, email, password } = data;

    try {
      await db.query(
        `UPDATE users SET username=?, email=?, password=? WHERE id=?`,
        [username, email, password, userId]
      );
      return { message: "Usuario actualizado exitosamente." };
    } catch (error) {
      return { message: "Error al actualizar usuario." };
    }
  }

  //DELETE USER
  async deleteUser(id) {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { message: "Foto eliminada con éxito" };
  }
}

module.exports = UserRepositoryMySQL;
