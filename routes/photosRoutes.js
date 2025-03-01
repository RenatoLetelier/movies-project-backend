const express = require('express');
const router = express.Router();
const { getAllPhotos, getPhotoById, createPhoto, updatePhoto, deletePhoto, seePhoto } = require('../controllers/photosController');

router.get('/photos', getAllPhotos);
router.get('/photo/:id', getPhotoById);
router.get('/see/:id', seePhoto);
router.post('/photo', createPhoto);
router.put('/photo/:id', updatePhoto);
router.delete('/photo/:id', deletePhoto);

module.exports = router;
