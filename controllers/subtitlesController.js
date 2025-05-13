const subtitleService = require("../services/subtitlesService");
const fs = require("fs");
const path = require("path");

exports.getAllSubtitles = async (req, res) => {
  try {
    const subtitles = await subtitleService.getAllSubtitles();
    res.status(200).json(subtitles);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener las fotos" });
  }
};

exports.getSubtitleById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Id de la foto es requerido" });
  }

  try {
    const subtitle = await subtitleService.getSubtitleById(id);

    if (!subtitle) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    res.status(200).json(subtitle);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la foto" });
  }
};

exports.createSubtitle = async (req, res) => {
  const { name, path } = req.body;

  if (!name || !path) {
    return res
      .status(400)
      .json({ message: "Nombre y ruta del archivo son requeridos" });
  }

  try {
    const result = await subtitleService.createSubtitle(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al crear la foto" });
  }
};

exports.updateSubtitle = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Id de la foto es requerido" });
  }

  try {
    const result = await subtitleService.updateSubtitle(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar la foto." });
  }
};

exports.deleteSubtitle = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Id de la foto es requerido" });
  }

  try {
    const result = await subtitleService.deleteSubtitle(id);

    if (!result) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la foto" });
  }
};

exports.streamSubtitleById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Id de la foto es requerido" });
  }

  try {
    const subtitlePath = await subtitleService.getSubtitlePathById(id);

    if (!fs.existsSync(subtitlePath)) {
      return res.status(404).send("Subtítulo no encontrado.");
    }

    const ext = path.extname(subtitlePath).toLowerCase();

    if (ext === ".srt") {
      const srtData = fs.readFileSync(subtitlePath, "utf-8");
      const vttData =
        "WEBVTT\n\n" +
        srtData
          .replace(/\d+\n/g, "") // borrar numeración de bloques
          .replace(/,/g, "."); // cambiar "," por "." en timestamps

      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      res.send(vttData);
    } else {
      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      const readStream = fs.createReadStream(subtitlePath);
      readStream.pipe(res);
    }
  } catch (error) {
    res.status(500).json({ message: "Error al hacer streaming del subtitulo" });
  }
};
