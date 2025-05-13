const photoService = require("../services/photosService");
const fs = require("fs");
// const multer = require('multer');

exports.getAllPhotos = async (req, res) => {
  try {
    const photos = await photoService.getAllPhotos();
    res.status(200).json(photos);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener las fotos" });
  }
};

exports.getPhotoById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id de la foto es requerido" });
  }

  try {
    const photo = await photoService.getPhotoById(id);

    if (!photo) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    res.status(200).json(photo);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la foto" });
  }
};

exports.createPhoto = async (req, res) => {
  const { name, path } = req.body;
  if (!name || !path) {
    return res
      .status(400)
      .json({ message: "Nombre y ruta de la foto son requeridos" });
  }

  try {
    const result = await photoService.createPhoto(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al crear la foto" });
  }
};

exports.updatePhoto = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id de la foto es requerido" });
  }

  try {
    const result = await photoService.updatePhoto(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar la foto." });
  }
};

exports.deletePhoto = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id de la foto es requerido" });
  }

  try {
    const result = await photoService.deletePhoto(id);

    if (!result) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la foto" });
  }
};

exports.streamPhotoById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "El id de la foto es requerido" });
  }

  try {
    const photoPath = await photoService.getPhotoPathById(id);

    if (!photoPath) {
      return res
        .status(404)
        .json({ message: "Foto no encontrada en la base de datos" });
    }

    if (!fs.existsSync(photoPath)) {
      return res
        .status(404)
        .json({ message: "El archivo de la foto no existe en el sistema." });
    }

    res.sendFile(photoPath, (err) => {
      if (err) {
        res.status(404).json({ message: "Imagen no encontrada." });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error al hacer streaming de la foto" });
  }
};

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });

// module.exports = {getAllPhotos, getPhotoById, streamPhoto, createPhoto, updatePhoto, deletePhoto};
