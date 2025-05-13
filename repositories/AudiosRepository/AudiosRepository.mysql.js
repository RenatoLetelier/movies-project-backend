const db = require("../../models/SQL_xampp");
const AudioRepository = require("./AudiosRepository.interface");

class AudioRepositoryMySQL extends AudioRepository {
  //GET ALL AUDIOS
  async getAllAudios() {
    const query = "SELECT * FROM audios";
    const [rows] = await db.query(query);
    return rows;
  }

  //GET ONE AUDIO
  async getAudioById(id) {
    const query = `SELECT * FROM audios WHERE id = ?;`;

    const [results] = await db.query(query, id);
    if (results.length === 0) return null;

    return results[0];
  }

  //CREATE AUDIO
  async createAudio(data) {
    const { movie_id, language, path, timeGap } = data;

    try {
      const [existingAudios] = await db.query(
        "SELECT id FROM audios WHERE movie_id = ? AND language = ?",
        [movie_id, language]
      );
      if (existingAudios.length > 0) {
        return {
          message:
            "La pista de audio con ese idioma ya existe para esta pelicula",
        };
      }

      await db.query(
        "INSERT INTO audios (movie_id, language, path, timeGap) VALUES (?, ?, ?, ?)",
        [movie_id, language, path, timeGap]
      );

      return { message: "Audio creado con éxito" };
    } catch (error) {
      console.error("❌ Error al crear audio:", error);
      return { message: "Error al crear audio" };
    }
  }

  //UPDATE AUDIO
  async updateAudio(audioId, data) {
    const { movie_id, language, path, timeGap } = data;

    const query = `SELECT * FROM audios WHERE id = ?;`;

    const [results] = await db.query(query, audioId);
    if (results.length === 0) return { message: "Audio no encontrado." };

    try {
      await db.query(
        `UPDATE audios SET movie_id=?, language=?, path=?, timeGap=? WHERE id=?`,
        [movie_id, language, path, timeGap, audioId]
      );
      return { message: "Audio actualizado exitosamente." };
    } catch (error) {
      return { message: "Error al actualizar audio." };
    }
  }

  //DELETE AUDIO
  async deleteAudio(id) {
    const [result] = await db.query("DELETE FROM audios WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { message: "Audio eliminado con éxito" };
  }

  //GET AUDIO PATH BY ID
  async getAudioPathById(id) {
    const [rows] = await db.query("SELECT path FROM audios WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0].path : null;
  }
}

module.exports = AudioRepositoryMySQL;
