const db = require("../../models/SQL_xampp");
const SubtitleRepository = require("./SubtitlesRepository.interface");
const fs = require("fs");

class SubtitleRepositoryMySQL extends SubtitleRepository {
  //GET ALL SUBTITLES
  async getAllSubtitles() {
    const query = "SELECT * FROM subtitles";
    const [rows] = await db.query(query);
    return rows;
  }

  //GET ONE SUBTITLE
  async getSubtitleById(id) {
    const query = `SELECT * FROM subtitles WHERE id=?`;

    const [results] = await db.query(query, id);
    if (results.length === 0) return null;

    const subtitle = results[0];

    return {
      id: subtitle.id,
      movie_id: subtitle.movie_id,
      name: subtitle.name,
      language: subtitle.language,
      path: subtitle.path,
    };
  }

  //CREATE PHOTO
  async createSubtitle(data) {
    const { movie_id, name, language, path } = data;

    const [existing] = await db.query(
      "SELECT id FROM subtitles WHERE language = ?",
      [data.language]
    );

    if (existing.length > 0) {
      throw new Error("Ya existe subtitulos en ese idioma");
    }

    const [subtitleResult] = await db.query(
      `INSERT INTO subtitles (movie_id, name, language, path) VALUES (?, ?, ?, ?)`,
      [movie_id, name, language, path]
    );

    const subtitleId = subtitleResult.insertId;

    return { subtitleId, message: "Foto creada con éxito" };
  }

  //UPDATE MOVIE
  async updateSubtitle(subtitleId, data) {
    const { movie_id, name, language, path } = data;

    await db.query(
      `UPDATE subtitles SET movie_id=?, name=?, language=?, path=? WHERE id=?`,
      [movie_id, name, language, path, subtitleId]
    );

    return { message: "Foto actualizada exitosamente." };
  }

  //DELETE PHOTO
  async deleteSubtitle(id) {
    const [result] = await db.query("DELETE FROM subtitles WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { message: "Foto eliminada con éxito" };
  }

  //STREAM PHOTO
  async getSubtitlePathById(id) {
    const [rows] = await db.query("SELECT path FROM subtitles WHERE id = ?", [
      id,
    ]);
    return rows.length > 0 ? rows[0].path : null;
  }
}

module.exports = SubtitleRepositoryMySQL;
