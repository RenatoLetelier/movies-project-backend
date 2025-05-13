const { console } = require("inspector");
const movieService = require("../services/moviesService");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

exports.getAllMovies = async (req, res) => {
  try {
    const movies = await movieService.getAllMovies();
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener las películas" });
  }
};

exports.getMovieById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id es requerido" });
  }

  try {
    const movie = await movieService.getMovieById(id);

    if (!movie) {
      return res.status(404).json({ message: "Película no encontrada" });
    }

    res.status(200).json(movie);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la película" });
  }
};

exports.createMovie = async (req, res) => {
  const { title, path } = req.body;
  if (!title || !path) {
    return res
      .status(400)
      .json({ message: "Título y ruta del archivo son requeridos" });
  }

  try {
    const result = await movieService.createMovie(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al crear la película" });
  }
};

exports.updateMovie = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id es requerido" });
  }

  try {
    const result = await movieService.updateMovie(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar la película." });
  }
};

exports.deleteMovie = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id es requerido" });
  }

  try {
    const result = await movieService.deleteMovie(id);

    if (!result) {
      return res.status(404).json({ message: "Película no encontrada" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la película" });
  }
};

exports.streamMovieById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id es requerido" });
  }

  try {
    const moviePath = await movieService.getMoviePathById(id);

    if (!moviePath) {
      return res
        .status(404)
        .json({ message: "Película no encontrada en la base de datos" });
    }

    if (!fs.existsSync(moviePath)) {
      return res
        .status(404)
        .json({
          message: "El archivo de la película no existe en el sistema.",
        });
    }

    const ext = path.extname(moviePath).toLowerCase();

    if (ext === ".mp4") {
      const stat = fs.statSync(moviePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(moviePath, { start, end });
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
        };

        res.writeHead(200, head);
        fs.createReadStream(moviePath).pipe(res);
      }
    } else {
      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Transfer-Encoding": "chunked",
      });

      ffmpeg(moviePath)
        .format("mp4")
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions("-movflags frag_keyframe+empty_moov")
        .on("start", (commandLine) => {
          console.log("🎬 FFMPEG proceso iniciado:", commandLine);
        })
        .on("error", (err) => {
          res.destroy();
        })
        .pipe(res, { end: true });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al hacer streaming de la película" });
  }
};
