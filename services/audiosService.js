const config = require("../config");

let AudiosRepository;

if (config.DB_TYPE === "mysql") {
  AudiosRepository =
    new (require("../repositories/AudiosRepository/AudiosRepository.mysql"))();
} else if (config.DB_TYPE === "mongodb") {
  AudiosRepository =
    new (require("../repositories/AudiosRepository/AudiosRepository.mongodb"))();
}

module.exports = {
  getAllAudios: async () => await AudiosRepository.getAllAudios(),
  getAudioById: async (id) => await AudiosRepository.getAudioById(id),
  createAudio: async (data) => await AudiosRepository.createAudio(data),
  updateAudio: async (id, data) => await AudiosRepository.updateAudio(id, data),
  deleteAudio: async (id) => await AudiosRepository.deleteAudio(id),
  getAudioPathById: async (id) => await AudiosRepository.getAudioPathById(id),
};
