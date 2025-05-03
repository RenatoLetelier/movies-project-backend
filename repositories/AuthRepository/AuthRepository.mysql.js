const db = require("../../models/SQL_xampp");
const AuthRepository = require("./AuthRepository.interface");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthRepositoryMySQL extends AuthRepository {
  //SIGNUP
  async signup(data) {
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

  //SIGNIN
  async signin(data) {
    const { username, password } = data;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username y password son requeridos" });
    }

    try {
      const [results] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      if (results.length === 0) {
        return { error: "Usuario no encontrado" };
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return { error: "Contraseña incorrecta" };
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Nuevo usuario sin contraseña
      const newUser = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      return { message: "Inicio de sesión exitoso", token, newUser };
    } catch (error) {
      console.error("❌ Error en login:", error);
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
      console.error("❌ Error al obtener perfil:", error);
      res.status(500).json({ error: "Error al obtener perfil" });
    }
  }
}

module.exports = AuthRepositoryMySQL;
