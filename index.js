const express = require('express');
const cors = require('cors');
const path = require('path');
//const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const moviesRoutes = require('./routes/moviesRoutes');
const photosRoutes = require('./routes/photosRoutes');

const app = express();

const MOVIES_DIR = process.env.MOVIES_DIR;
const HOST = process.env.SERVER_HOST;
const PORT = process.env.SERVER_PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_HOST = process.env.DB_HOST;


app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/photos', photosRoutes);

// Middleware para verificar token
function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'Acceso denegado' });
  
    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: 'Token inválido' });
  
      req.user = decoded;
      next();
    });
}

// Ruta principal
app.get('/', (req, res) => {
    res.send('Home server working correctly!');
});

// 📌 Ruta protegida (requiere token)
app.get('/profile', verificarToken, (req, res) => {
    res.json({ message: 'Bienvenido al perfil protegido', user: req.user });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor funcionando en http://${HOST}:${PORT}`);
});
