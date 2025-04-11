const express = require('express');
const router = express.Router();
const { getAllPhotos, getPhotoById, getImage, createPhoto, updatePhoto, deletePhoto } = require('../controllers/photosController');

router.get('/', getAllPhotos);
router.get('/:id', getPhotoById);
router.get('/see/:name', getImage);
router.post('/', createPhoto);
router.put('/:id', updatePhoto);
router.delete('/:id', deletePhoto);

module.exports = router;
