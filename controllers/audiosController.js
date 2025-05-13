const { console } = require("inspector");
const audiosService = require("../services/audiosService");
const fs = require("fs");
const path = require("path");

exports.getAllAudios = async (req, res) => {
  try {
    const audios = await audiosService.getAllAudios();
    res.status(200).json(audios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los audios" });
  }
};

exports.getAudioById = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await audiosService.getAudioById(id);

    if (!audio) {
      return res.status(404).json({ message: "Audio no encontrado" });
    }

    res.status(200).json(audio);
  } catch (error) {
    console.error("❌ Error en getAudioById:", error);
    res.status(500).json({ message: "Error al obtener el audio" });
  }
};

exports.createAudio = async (req, res) => {
  const { movie_id, language, path } = req.body;

  if (!movie_id || !language || !path) {
    return res
      .status(500)
      .json({ message: "movie_id, path y language son requeridos" });
  }

  try {
    const result = await audiosService.createAudio(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Error en createAudio:", error);
    res
      .status(500)
      .json({ message: error.message || "Error al crear el audio" });
  }
};

exports.updateAudio = async (req, res) => {
  const { movie_id, language, path } = req.body;
  const { id } = req.params;

  if (!movie_id || !language || !path) {
    return res
      .status(500)
      .json({ message: "movie_id, path y language son requeridos" });
  }
  if (!id) {
    return res.status(400).json({ message: "El id es requerido" });
  }

  try {
    const result = await audiosService.updateAudio(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error en updateAudio:", err);
    res.status(500).json({ error: "Error al actualizar el audio." });
  }
};

exports.deleteAudio = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id es requerido" });
  }

  try {
    const result = await audiosService.deleteAudio(id);

    if (!result) {
      return res.status(404).json({ message: "Audio no encontrado" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error en deleteAudio:", error);
    res.status(500).json({ message: "Error al eliminar el audio" });
  }
};

exports.streamAudioById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "El id es requerido" });
  }

  try {
    const audioPath = await audiosService.getAudioPathById(id);

    if (!audioPath) {
      return res
        .status(404)
        .json({ message: "Audio no encontrado en la base de datos" });
    }

    if (!fs.existsSync(audioPath)) {
      return res
        .status(404)
        .send("El archivo de audio no existe en el sistema.");
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const mimeType = getMimeType(audioPath);

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(audioPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": mimeType,
      };

      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error("❌ Error en streamAudioById:", error);
    res.status(500).json({ message: "Error al hacer streaming del audio" });
  }
};

// Función auxiliar para obtener el tipo MIME según la extensión
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".aac":
      return "audio/aac";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    default:
      return "application/octet-stream";
  }
}
