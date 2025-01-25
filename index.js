const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json()); // Middleware para procesar JSON en el body de la petición

let MOVIES_DIR = 'E:/Peliculas/Peliculas';

// Función para convertir archivos .mkv a .mp4 solo si es necesario
function convertToMp4(filePath, outputDir, callback) {
    const fileName = path.basename(filePath, path.extname(filePath)) + '.mp4';
    const outputPath = path.join(outputDir, fileName);

    if (fs.existsSync(outputPath)) {
        console.log(`✅ El archivo ya existe: ${outputPath}`);
        return callback(null, outputPath);
    }

    console.log(`🔄 Convirtiendo ${filePath} a formato .mp4...`);

    ffmpeg(filePath)
        .output(outputPath)
        .videoCodec('copy')
        .audioCodec('copy')
        .on('end', () => {
            console.log(`✅ Conversión completa: ${outputPath}`);
            callback(null, outputPath);
        })
        .on('error', (err) => {
            console.error(`❌ Error al convertir ${filePath}:`, err);
            callback(err);
        })
        .run();
}

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

// <<< --- RUTAS --- >>> //

// Ruta principal
app.get('/', (req, res) => {
    res.send('Servidor de películas funcionando correctamente. Visita /movies para ver la lista de películas.');
});

// Ruta para listar todas las películas disponibles
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
        //convertToMp4(filePath, MOVIES_DIR, (err, convertedPath) => {
        //    if (err) {
        //        return res.status(500).send('Error al convertir la película.');
        //    }
        //    streamMovie(convertedPath, res, req);
        //});
        console.log('No se puede reproducir archivos .mkv');
    } else {
        streamMovie(filePath, res, req);
    }
});

// Ruta para actualizar la ruta de la carpeta de películas
app.post('/movies/set-path', (req, res) => {
    const { path: newPath } = req.body;

    if (!newPath || !fs.existsSync(newPath)) {
        return res.status(400).send('Ruta no válida o no encontrada.');
    }

    MOVIES_DIR = newPath;
    console.log(`📁 Ruta de películas actualizada: ${MOVIES_DIR}`);
    res.send(`Ruta de películas actualizada: ${MOVIES_DIR}`);
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🎬 Servidor funcionando en http://localhost:${PORT}`);
    console.log(`📜 Películas disponibles en http://localhost:${PORT}/movies`);
});
