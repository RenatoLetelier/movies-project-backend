const config = require("../config");

let SubtitlesRepository;

if (config.DB_TYPE === "mysql") {
  SubtitlesRepository =
    new (require("../repositories/SubtitlesRepository/SubtitlesRepository.mysql"))();
} else if (config.DB_TYPE === "mongodb") {
  SubtitlesRepository =
    new (require("../repositories/SubtitlesRepository/SubtitlesRepository.mongodb"))();
}

module.exports = {
  getAllSubtitles: async () => await SubtitlesRepository.getAllSubtitles(),
  getSubtitleById: async (id) => await SubtitlesRepository.getSubtitleById(id),
  createSubtitle: async (data) =>
    await SubtitlesRepository.createSubtitle(data),
  updateSubtitle: async (id, data) =>
    await SubtitlesRepository.updateSubtitle(id, data),
  deleteSubtitle: async (id) => await SubtitlesRepository.deleteSubtitle(id),
  getSubtitlePathById: async (id) =>
    await SubtitlesRepository.getSubtitlePathById(id),
};
