const express = require('express');
const cors = require('cors');
require('dotenv').config();
const config = require('./config');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const moviesRoutes = require('./routes/moviesRoutes');
const photosRoutes = require('./routes/photosRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/photos', photosRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Home server working correctly!');
});

// Error route
app.get('*', (req, res) => {
    res.send('Error page, please come back /home.');
});

// Start server
app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://${config.HOST}:${config.PORT}`);
});

// const jwt = require('jsonwebtoken');
// const fs = require('fs');
// const ffmpeg = require('fluent-ffmpeg');
// const path = require('path');

// const router = express.Router();

// Middleware para verificar token
// function verificarToken(req, res, next) {
//     const token = req.headers['authorization'];
//     if (!token) return res.status(403).json({ error: 'Acceso denegado' });
  
//     jwt.verify(token.split(' ')[1], config.JWT_SECRET, (err, decoded) => {
//       if (err) return res.status(401).json({ error: 'Token inválido' });
  
//       req.user = decoded;
//       next();
//     });
// }

// 📌 Ruta protegida (requiere token)
// app.get('/profile', verificarToken, (req, res) => {
//     res.json({ message: 'Bienvenido al perfil protegido', user: req.user });
// });

// app.get('/movies/muxed/:id', (req, res) => {
//     const movieId = req.params.id;
//     const videoFile = "video";
//     const audioFile = "audio";
    
//     const videoPath = path.join(__dirname, `./uploads/${videoFile}.mp4`);
//     const audioPath = path.join(__dirname, `./uploads/${audioFile}${movieId}.mp3`);
//     const muxedPath = path.join(__dirname, `./uploads/muxed-${movieId}.mp4`);
  
//     if (!fs.existsSync(videoPath) || !fs.existsSync(audioPath)) {
//       return res.status(404).send('Video or audio file not found');
//     }

//     // Si el archivo ya está muxeado, lo servimos directamente
//     if (fs.existsSync(muxedPath)) {
//         return res.sendFile(muxedPath);
//     }
  
//     res.contentType('video/mp4');
  
//     ffmpeg()
//     .input(videoPath)
//     .input(audioPath)
//     .outputOptions([
//       '-map 0:v:0',
//       '-map 1:a:0',
//       '-c:v copy',
//       '-c:a aac',
//       '-b:a 192k',
//       '-movflags frag_keyframe+empty_moov' // para compatibilidad con streaming
//     ])
//     .on('start', cmd => {
//       console.log('Muxing command:', cmd);
//     })
//     .on('end', () => {
//       console.log('Muxing completed.');
//       res.sendFile(muxedPath);
//     })
//     .on('error', err => {
//       console.error('FFmpeg error:', err);
//       if (!res.headersSent) res.status(500).send('Error muxing media');
//     })
//     .save(muxedPath);
// });
