const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
//const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const multer = require('multer');

const authRoutes = require('./routes/authRoutes');
const moviesRoutes = require('./routes/moviesRoutes');
const photosRoutes = require('./routes/photosRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/photos', photosRoutes);

const MOVIES_DIR = process.env.MOVIES_DIR;
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_HOST = process.env.DB_HOST;

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Función para manejar el streaming del archivo de video
function streamMovie(moviePath, res, req) {
    if (!fs.existsSync(moviePath)) {
        return res.status(404).send('Película no encontrada.');
    }

    const stat = fs.statSync(moviePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunkSize = (end - start) + 1;
        const file = fs.createReadStream(moviePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(200, head);
        fs.createReadStream(moviePath).pipe(res);
    }
}

app.get('/movies', (req, res) => {
    fs.readdir(MOVIES_DIR, (err, files) => {
        if (err) {
            return res.status(500).send('Error al leer el directorio de películas.');
        }

        const movies = files
            .filter(file => /\.(mp4|mkv)$/i.test(file))
            .map((file, index) => ({
                id: index + 1,
                name: path.basename(file, path.extname(file)),
                address: `http://${req.hostname}:${PORT}/stream/${encodeURIComponent(file)}`,
            }));

        res.json(movies);
    });
});

// Ruta para hacer streaming de una película
app.get('/stream/:movie', (req, res) => {
    const requestedFile = req.params.movie;
    const filePath = path.join(MOVIES_DIR, requestedFile);
    const ext = path.extname(requestedFile).toLowerCase();

    if (ext === '.mkv') {
        console.log('No se puede reproducir archivos .mkv');
        console.log('Pero vamos a intentar de todas formas...');
        streamMovie(filePath, res, req);
    } else {
        streamMovie(filePath, res, req);
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.send('Servidor de películas funcionando correctamente. Visita /movies para ver la lista de películas.');
});

// 📌 Ruta protegida (requiere token)
app.get('/profile', verificarToken, (req, res) => {
    res.json({ message: 'Bienvenido al perfil protegido', user: req.user });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor funcionando en http://${DB_HOST}:${PORT}`);
});
