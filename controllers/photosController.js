const photoService = require('../services/photosService');
const fs = require('fs');
const path = require('path');
// const multer = require('multer');

exports.getAllPhotos = async (req, res) => {
  try {
    const photos = await photoService.getAllPhotos();
    res.status(200).json(photos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las fotos' });
  }
};

exports.getPhotoById = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await photoService.getPhotoById(id);

    if (!photo) {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }

    res.status(200).json(photo);
  } catch (error) {
    console.error("❌ Error en getPhotoById:", error);
    res.status(500).json({ message: 'Error al obtener la foto' });
  }
};

exports.createPhoto = async (req, res) => {
  try {
    const { name, path } = req.body;

    if (!name || !path) {
      return res.status(400).json({ message: 'Nombre y ruta del archivo son requeridos' });
    }

    const result = await photoService.createPhoto(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error en createPhoto:', error);
    res.status(500).json({ message: error.message || 'Error al crear la foto' });
  }
};

exports.updatePhoto = async (req, res) => {
  try {
    const result = await photoService.updatePhoto(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error en updatePhoto:", err);
    res.status(500).json({ error: 'Error al actualizar la foto.' });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const result = await photoService.deletePhoto(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error en deletePhoto:', error);
    res.status(500).json({ message: 'Error al eliminar la foto' });
  }
};

exports.streamPhotoByFileName = async (req, res) => {
  const fileName = req.params.name;
  
  if (!fileName) {
    return res.status(400).json({ message: 'El nombre del archivo es requerido' });
  }
  
  try {
    const photoPath = await photoService.getPhotoPathByName(fileName);
    
    if (!photoPath) {
      return res.status(404).json({ message: 'Foto no encontrada en la base de datos' });
    }

    const imgRute = path.join(__dirname, '../uploads', photoPath);
    
    if (!fs.existsSync(imgRute)) {
      return res.status(404).send('El archivo de la foto no existe en el sistema.');
    }

    res.sendFile(imgRute, err => {
      if (err) {
        res.status(404).send('Imagen no encontrada.');
      }
    });
  } catch (error) {
    console.error('❌ Error en streamPhotoByFileName:', error);
    res.status(500).json({ message: 'Error al hacer streaming de la foto' });
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