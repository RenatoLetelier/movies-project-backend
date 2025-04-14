const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/Users_db');

const getAllUsers = async (req, res) => {
    try {
      const [users] = await db.query('SELECT id, username, email FROM users');
  
      res.status(200).json(users);
    } catch (error) {
      console.error('❌ Error al obtener los usuarios:', error);
      res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};

const getUserById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const [results] = await db.query('SELECT id, username, email FROM users WHERE id = ?', [id]);
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      res.status(200).json(results[0]);
    } catch (error) {
      console.error('❌ Error al obtener el usuario:', error);
      res.status(500).json({ message: 'Error al obtener el usuario' });
    }
};

const createUser = async (req, res) => {
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

const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, password } = req.body;
  
      // Verificar si el usuario existe
      const [existingUsers] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      if (existingUsers.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      // Preparar campos a actualizar
      let updateQuery = 'UPDATE users SET ';
      const updateFields = [];
      const params = [];
  
      if (username) {
        updateFields.push('username = ?');
        params.push(username);
      }
      
      if (email) {
        updateFields.push('email = ?');
        params.push(email);
      }
  
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password = ?');
        params.push(hashedPassword);
      }
  
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No hay datos para actualizar' });
      }
  
      updateQuery += updateFields.join(', ') + ' WHERE id = ?';
      params.push(id);
  
      await db.query(updateQuery, params);
  
      res.status(200).json({ message: 'Usuario actualizado con éxito' });
  
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
  
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      res.status(200).json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
  };