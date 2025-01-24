const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg'); // Usamos fluent-ffmpeg para convertir videos.

const app = express();
const PORT = 8000;

// Habilitar CORS
app.use(cors());

// Directorio donde están las películas
const MOVIES_DIR = 'E:/Peliculas/Peliculas';

// Función para convertir archivos .mkv a .mp4 solo si es necesario
function convertToMp4(filePath, outputDir, callback) {
    const fileName = path.basename(filePath, path.extname(filePath)) + '.mp4';
    const outputPath = path.join(outputDir, fileName);

    // Verificar si el archivo .mp4 ya existe para evitar conversiones innecesarias
    if (fs.existsSync(outputPath)) {
        console.log(`✅ El archivo ya existe: ${outputPath}`);
        return callback(null, outputPath);
    }

    console.log(`🔄 Convirtiendo ${filePath} a formato .mp4...`);

    ffmpeg(filePath)
        .output(outputPath)
        .videoCodec('copy') // Copiar el codec de video original
        .audioCodec('copy') // Copiar el codec de audio original
        .on('end', () => {
            console.log(`✅ Conversión completa: ${outputPath} (Ahora está disponible para streaming)`);
            callback(null, outputPath);
        })
        .on('error', (err) => {
            console.error(`❌ Error al convertir ${filePath}:`, err);
            callback(err);
        })
        .run();
}

// Ruta para listar todas las películas disponibles
app.get('/movies', (req, res) => {
    fs.readdir(MOVIES_DIR, (err, files) => {
        if (err) {
            return res.status(500).send('Error al leer el directorio de películas.');
        }

        // Filtrar solo archivos de video válidos (.mp4 y .mkv)
        const movies = files
            .filter(file => /\.(mp4|mkv)$/i.test(file)) // Solo archivos de video
            .map((file, index) => ({
                id: index + 1,
                name: path.basename(file, path.extname(file)), // Nombre sin extensión
                address: `http://${req.hostname}:${PORT}/stream/${encodeURIComponent(file)}`,
            }));

        res.json(movies);
    });
});

// Ruta para hacer streaming de una película (con conversión si es .mkv)
app.get('/stream/:movie', (req, res) => {
    const requestedFile = req.params.movie;
    const filePath = path.join(MOVIES_DIR, requestedFile);
    const ext = path.extname(requestedFile).toLowerCase();

    // Si el archivo solicitado es un .mkv, convertirlo antes de hacer streaming
    if (ext === '.mkv') {
        convertToMp4(filePath, MOVIES_DIR, (err, convertedPath) => {
            if (err) {
                return res.status(500).send('Error al convertir la película.');
            }
            streamMovie(convertedPath, res, req);
        });
    } else {
        streamMovie(filePath, res, req);
    }
});

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

// Ruta base para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.send('Servidor de películas funcionando correctamente. Visita /movies para ver la lista de películas.');
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🎬 Servidor funcionando en http://localhost:${PORT}`);
    console.log(`📜 Películas disponibles en http://localhost:${PORT}/movies`);
});
