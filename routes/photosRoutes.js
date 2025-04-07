const express = require('express');
const router = express.Router();
const { getAllPhotos, getPhotoById, getImage, createPhoto, updatePhoto, deletePhoto } = require('../controllers/photosController');

router.get('/photos', getAllPhotos);
router.get('/photos/:id', getPhotoById);
router.get('/images/:name', getImage);
router.post('/photos', createPhoto);
router.put('/photos/:id', updatePhoto);
router.delete('/photos/:id', deletePhoto);

module.exports = router;
