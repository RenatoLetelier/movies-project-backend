const db = require("../../models/SQL_xampp");
const PhotoRepository = require("./PhotosRepository.interface");
const fs = require("fs");

class PhotoRepositoryMySQL extends PhotoRepository {
  //GET ALL PHOTOS
  async getAllPhotos() {
    const query = "SELECT * FROM photos";
    const [rows] = await db.query(query);
    return rows;
  }

  //GET ONE MOVIE
  async getPhotoById(id) {
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.description,
        p.uploadedBy,
        p.orientation,
        p.path, 
        p.location,
        p.dimensions,
        p.size,
        p.takenAt,
        GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS albums,
        GROUP_CONCAT(DISTINCT t.name SEPARATOR ', ') AS tags,
        GROUP_CONCAT(DISTINCT o.name SEPARATOR ', ') AS persons
      FROM photos p
      LEFT JOIN photo_albums pa ON p.id = pa.photo_id
      LEFT JOIN albums a ON pa.album_id = a.id
      LEFT JOIN photo_tags pt ON p.id = pt.photo_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      LEFT JOIN photo_persons pp ON p.id = pp.person_id
      LEFT JOIN persons o ON pp.person_id = o.id
      WHERE p.id = ?
      GROUP BY p.id;
    `;

    const [results] = await db.query(query, id);
    if (results.length === 0) return null;

    const photo = results[0];
    // const fileExists = fs.existsSync(photo.path);

    return {
      id: photo.id,
      name: photo.name,
      description: photo.description,
      uploadedBy: photo.uploadedBy,
      orientation: photo.orientation,
      path: photo.path,
      metadata: {
        location: photo.location,
        dimensions: photo.dimensions,
        size: photo.size,
        takenAt: photo.takenAt,
      },
      tags: photo.tags ? photo.tags.split(", ") : [],
      albums: photo.albums ? photo.albums.split(", ") : [],
      persons: photo.persons ? photo.persons.split(", ") : [],
    };
  }

  //CREATE PHOTO
  async createPhoto(data) {
    const {
      name,
      description,
      uploadedBy,
      orientation,
      path,
      location,
      dimensions,
      size,
      takenAt,
      tags,
      albums,
      persons,
    } = data;

    const [existing] = await db.query("SELECT id FROM photos WHERE name = ?", [
      data.name,
    ]);

    if (existing.length > 0) {
      throw new Error("Ya existe una foto con este nombre");
    }

    const [photoResult] = await db.query(
      `INSERT INTO photos (name, description, uploadedBy, orientation, path, location, dimensions, size, takenAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        uploadedBy,
        orientation,
        path,
        location,
        dimensions,
        size,
        takenAt,
      ]
    );

    const photoId = photoResult.insertId;

    for (const tagName of tags) {
      const [tagRows] = await db.query("SELECT id FROM tags WHERE name=?", [
        tagName,
      ]);
      let tagId;

      if (tagRows.length > 0) {
        tagId = tagRows[0].id;
      } else {
        const [result] = await db.query("INSERT INTO tags (name) VALUES (?)", [
          tagName,
        ]);
        tagId = result.insertId;
      }

      await db.query(
        "INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)",
        [photoId, tagId]
      );
    }

    for (const albumName of albums) {
      const [albumRows] = await db.query("SELECT id FROM albums WHERE name=?", [
        albumName,
      ]);
      let albumId;

      if (albumRows.length > 0) {
        albumId = albumRows[0].id;
      } else {
        const [result] = await db.query(
          "INSERT INTO albums (name) VALUES (?)",
          [albumName]
        );
        albumId = result.insertId;
      }

      await db.query(
        "INSERT INTO photo_albums (photo_id, album_id) VALUES (?, ?)",
        [photoId, albumId]
      );
    }

    for (const personName of persons) {
      const [personsRows] = await db.query(
        "SELECT id FROM persons WHERE name=?",
        [personName]
      );
      let personId;

      if (personsRows.length > 0) {
        personId = personsRows[0].id;
      } else {
        const [result] = await db.query(
          "INSERT INTO persons (name) VALUES (?)",
          [personName]
        );
        personId = result.insertId;
      }

      await db.query(
        "INSERT INTO photo_persons (photo_id, person_id) VALUES (?, ?)",
        [photoId, personId]
      );
    }

    return { photoId, message: "Foto creada con éxito" };
  }

  //UPDATE MOVIE
  async updatePhoto(photoId, data) {
    const {
      name,
      description,
      uploadedBy,
      orientation,
      path,
      location,
      dimensions,
      size,
      takenAt,
      tags,
      albums,
      persons,
    } = data;

    await db.query(
      `
        UPDATE photos SET 
            name=?, description=?, uploadedBy=?, 
            orientation=?, path=?, location=?, dimensions=?, size=?, takenAt=?
        WHERE id=?`,
      [
        name,
        description,
        uploadedBy,
        orientation,
        path,
        location,
        dimensions,
        size,
        takenAt,
        photoId,
      ]
    );

    await Promise.all([
      db.query("DELETE FROM photo_tags WHERE photo_id=?", [photoId]),
      db.query("DELETE FROM photo_albums WHERE photo_id=?", [photoId]),
      db.query("DELETE FROM photo_persons WHERE photo_id=?", [photoId]),
    ]);

    for (const tagName of tags) {
      const [tagRows] = await db.query("SELECT id FROM tags WHERE name=?", [
        tagName,
      ]);
      let tagId;

      if (tagRows.length > 0) {
        tagId = tagRows[0].id;
      } else {
        const [result] = await db.query("INSERT INTO tags (name) VALUES (?)", [
          tagName,
        ]);
        tagId = result.insertId;
      }

      await db.query(
        "INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)",
        [photoId, tagId]
      );
    }

    for (const albumName of albums) {
      const [albumRows] = await db.query("SELECT id FROM albums WHERE name=?", [
        albumName,
      ]);
      let albumId;

      if (albumRows.length > 0) {
        albumId = albumRows[0].id;
      } else {
        const [result] = await db.query(
          "INSERT INTO albums (name) VALUES (?)",
          [albumName]
        );
        albumId = result.insertId;
      }

      await db.query(
        "INSERT INTO photo_albums (photo_id, album_id) VALUES (?, ?)",
        [photoId, albumId]
      );
    }

    for (const personName of persons) {
      const [personsRows] = await db.query(
        "SELECT id FROM persons WHERE name=?",
        [personName]
      );
      let personId;

      if (personsRows.length > 0) {
        personId = personsRows[0].id;
      } else {
        const [result] = await db.query(
          "INSERT INTO persons (name) VALUES (?)",
          [personName]
        );
        personId = result.insertId;
      }

      await db.query(
        "INSERT INTO photo_persons (photo_id, person_id) VALUES (?, ?)",
        [photoId, personId]
      );
    }

    return { message: "Foto actualizada exitosamente." };
  }

  //DELETE PHOTO
  async deletePhoto(id) {
    await Promise.all([
      db.query("DELETE FROM photo_tags WHERE photo_id=?", [id]),
      db.query("DELETE FROM photo_albums WHERE photo_id=?", [id]),
      db.query("DELETE FROM photo_persons WHERE photo_id=?", [id]),
    ]);

    const [result] = await db.query("DELETE FROM photos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { message: "Foto eliminada con éxito" };
  }

  //STREAM PHOTO
  async getPhotoPathById(id) {
    const [rows] = await db.query("SELECT path FROM photos WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0].path : null;
  }
}

module.exports = PhotoRepositoryMySQL;
