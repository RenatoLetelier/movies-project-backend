const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/Photos_db');

const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verificar si el usuario ya existe en la base de datos
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: 'El usuario ya existe' });
            }

            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar el nuevo usuario
            db.query(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                [username, hashedPassword],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al registrar usuario' });
                    }
                    res.status(201).json({ message: 'Usuario registrado con éxito' });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el registro' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar usuario por username en la base de datos
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            if (results.length === 0) {
                return res.status(401).json({ error: 'Usuario no encontrado' });
            }

            const user = results[0];

            // Comparar la contraseña con la almacenada en la base de datos
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }

            // Crear token JWT
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({ message: 'Inicio de sesión exitoso', token });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el login' });
    }
};

module.exports = {register, login};