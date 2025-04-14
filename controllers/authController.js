const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/Users_db');

const register = async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Validar campos requeridos
      if (!username || !password) {
        return res.status(400).json({ message: 'Username y password son requeridos' });
      }
  
      // Verificar si el usuario ya existe
      const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'El usuario ya existe' });
      }
  
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insertar el nuevo usuario
      await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
  
      res.status(201).json({ message: 'Usuario creado con éxito' });
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      res.status(500).json({ message: 'Error al crear usuario' });
    }
};

const login = async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Validar entrada
      if (!username || !password) {
        return res.status(400).json({ error: 'Username y password son requeridos' });
      }
  
      // Buscar usuario
      const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  
      if (results.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
  
      const user = results[0];
  
      // Comparar contraseñas
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
  
      // Generar token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.status(200).json({ message: 'Inicio de sesión exitoso', token });
    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({ error: 'Error en el login' });
    }
  };

module.exports = {register, login};