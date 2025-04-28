const subtitleService = require("../services/subtitlesService");
const fs = require("fs");

exports.getAllSubtitles = async (req, res) => {
  try {
    const subtitles = await subtitleService.getAllSubtitles();
    res.status(200).json(subtitles);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener las fotos" });
  }
};

exports.getSubtitleById = async (req, res) => {
  try {
    const { id } = req.params;
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
  try {
    const { name, path } = req.body;

    if (!name || !path) {
      return res
        .status(400)
        .json({ message: "Nombre y ruta del archivo son requeridos" });
    }

    const result = await subtitleService.createSubtitle(req.body);
    res.status(201).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Error al crear la foto" });
  }
};

exports.updateSubtitle = async (req, res) => {
  try {
    const result = await subtitleService.updateSubtitle(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error en updateSubtitle:", err);
    res.status(500).json({ error: "Error al actualizar la foto." });
  }
};

exports.deleteSubtitle = async (req, res) => {
  try {
    const result = await subtitleService.deleteSubtitle(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error en deleteSubtitle:", error);
    res.status(500).json({ message: "Error al eliminar la foto" });
  }
};

exports.streamSubtitleById = async (req, res) => {
  try {
    const { id } = req.params;

    const subtitlePath = await subtitleService.getSubtitlePathById(id);

    console.log("Subtítulo Path:", subtitlePath);

    if (!fs.existsSync(subtitlePath)) {
      return res.status(404).send("Subtítulo no encontrado.");
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    const readStream = fs.createReadStream(subtitlePath);

    readStream.on("error", (err) => {
      console.error("Error leyendo el archivo .srt:", err);
      res.status(500).send("Error interno al leer subtítulo.");
    });

    readStream.pipe(res);
  } catch (error) {
    console.error("❌ Error en streamSubtitleById:", error);
    res.status(500).json({ message: "Error al hacer streaming del subtitulo" });
  }
};
