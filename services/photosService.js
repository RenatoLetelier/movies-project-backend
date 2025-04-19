const config = require('../config');

let PhotosRepository;

if (config.DB_TYPE === 'mysql') {
    PhotosRepository = new (require('../repositories/PhotosRepository.mysql'))();
} else if (config.DB_TYPE === 'mongodb') {
    PhotosRepository = new (require('../repositories/PhotosRepository.mongodb'))();
}

module.exports = {
    getAllPhotos: async () => await PhotosRepository.getAllPhotos(),
    getPhotoById: async (id) => await PhotosRepository.getPhotoById(id),
    createPhoto: async (data) => await PhotosRepository.createPhoto(data),
    updatePhoto: async (id, data) => await PhotosRepository.updatePhoto(id, data),
    deletePhoto: async (id) => await PhotosRepository.deletePhoto(id),
    getPhotoPathByName: async (name) => await PhotosRepository.getPhotoPathByName(name)
};