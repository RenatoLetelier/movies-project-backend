const db = require('../models/Photos_db');
const PhotoRepository = require('./PhotosRepository.interface');
const fs = require('fs');

class PhotoRepositoryMySQL extends PhotoRepository {
  //GET ALL PHOTOS
  async getAllPhotos() {
    const query = 'SELECT * FROM photos'
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
            p.uploadBy, 
            p.isFavorite, 
            p.isPrivate, 
            p.orientation, 
            p.path, 
            m.location, 
            m.dimensions, 
            m.size, 
            m.photoDate, 
            m.photoTime, 
            GROUP_CONCAT(DISTINCT t.name SEPARATOR ', ') AS tags, 
            GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS albums, 
            GROUP_CONCAT(DISTINCT pe.name SEPARATOR ', ') AS people
        FROM photos p
        LEFT JOIN metadata m ON p.id = m.photo_id
        LEFT JOIN photo_tags pt ON p.id = pt.photo_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        LEFT JOIN photo_albums pa ON p.id = pa.photo_id
        LEFT JOIN albums a ON pa.album_id = a.id
        LEFT JOIN photo_people pp ON p.id = pp.photo_id
        LEFT JOIN people pe ON pp.person_id = pe.id
        WHERE p.id = ?
        GROUP BY p.id, m.location, m.dimensions, m.size, m.photoDate, m.photoTime;
    `;

    const [results] = await db.query(query, id);
    if (results.length === 0) return null;

    const photo = results[0];
    const fileExists = fs.existsSync(photo.path);

    return {
        id: photo.id,
        name: photo.name,
        description: photo.description,
        uploadBy: photo.uploadBy,
        isFavorite: !!photo.isFavorite,
        isPrivate: !!photo.isPrivate,
        orientation: photo.orientation,
        path: photo.path,
        fileExists,
        metadata: {
            location: photo.location,
            dimensions: photo.dimensions,
            size: photo.size,
            photoDate: photo.photoDate,
            photoTime: photo.photoTime
        },
        tags: photo.tags ? photo.tags.split(', ') : [],
        albums: photo.albums ? photo.albums.split(', ') : [],
        people: photo.people ? photo.people.split(', ') : []
    };
  }

  //CREATE PHOTO
  async createPhoto(data) {
    const { name, description, uploadBy, isFavorite, isPrivate, orientation, path, tags, albums, metadata } = data;

    const [existing] = await db.query('SELECT id FROM photos WHERE name = ?', [data.name]);
    
    if (existing.length > 0) {
      throw new Error('Ya existe una foto con este nombre');
    }
  
    const [photoResult] = await db.query(
      `INSERT INTO photos (name, description, uploadBy, isFavorite, isPrivate, orientation, path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, uploadBy, isFavorite, isPrivate, orientation, path]
    );
  
    const photoId = photoResult.insertId;

    await db.query(
        'INSERT INTO metadata (photo_id, location, dimensions, size, photoDate, photoTime) VALUES (?, ?, ?, ?, ?, ?)',
        [photoId, metadata.location, metadata.dimensions, metadata.size, metadata.photoDate, metadata.photoTime]
    );

    if (tags && tags.length > 0) {
        await Promise.all(tags.map(async (tag) => {
            await db.query('INSERT INTO photo_tags (photo_id, tag_id) SELECT ?, id FROM tags WHERE name = ?', [photoId, tag]);
        }));
    }

    if (albums && albums.length > 0) {
        await Promise.all(albums.map(async (album) => {
            await db.query('INSERT INTO photo_albums (photo_id, album_id) SELECT ?, id FROM albums WHERE name = ?', [photoId, album]);
        }));
    }

    if (metadata.people && metadata.people.length > 0) {
        await Promise.all(metadata.people.map(async (person) => {
            await db.query('INSERT INTO photo_people (photo_id, person_id) SELECT ?, id FROM people WHERE name = ?', [photoId, person]);
        }));
    }
  
    return { photoId, message: 'Foto creada con éxito' };
  }

  //UPDATE MOVIE
  async updatePhoto(photoId, data) {
    const {
        name,
        description,
        uploadBy,
        isFavorite,
        isPrivate,
        orientation,
        path,
        tags,
        albums,
        metadata
      } = data;
  
    await db.query(`
        UPDATE photos SET 
            name=?, description=?, uploadBy=?, 
            isFavorite=?, isPrivate=?, orientation=?, path=?
        WHERE id=?`,
        [name, description, uploadBy, isFavorite, isPrivate, orientation, path, photoId]
    );

    await db.query(`
        UPDATE metadata SET 
          location=?, dimensions=?, size=?, photoDate=?, photoTime=?
        WHERE photo_id=?`,
        [metadata.location, metadata.dimensions, metadata.size, metadata.photoDate, metadata.photoTime, photoId]
    );

    await Promise.all([
        db.query('DELETE FROM photo_tags WHERE photo_id=?', [photoId]),
        db.query('DELETE FROM photo_albums WHERE photo_id=?', [photoId]),
        db.query('DELETE FROM photo_people WHERE photo_id=?', [photoId]),
    ]);

    for (const tagName of tags) {
        const [tagRows] = await db.query('SELECT id FROM tags WHERE name=?', [tagName]);
        let tagId;
  
        if (tagRows.length > 0) {
          tagId = tagRows[0].id;
        } else {
          const [result] = await db.query('INSERT INTO tags (name) VALUES (?)', [tagName]);
          tagId = result.insertId;
        }
  
        await db.query('INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)', [photoId, tagId]);
    }

    for (const albumName of albums) {
        const [albumRows] = await db.query('SELECT id FROM albums WHERE name=?', [albumName]);
        let albumId;
  
        if (albumRows.length > 0) {
          albumId = albumRows[0].id;
        } else {
          const [result] = await db.query('INSERT INTO albums (name) VALUES (?)', [albumName]);
          albumId = result.insertId;
        }
  
        await db.query('INSERT INTO photo_albums (photo_id, album_id) VALUES (?, ?)', [photoId, albumId]);
    }
  
    for (const personName of metadata.people) {
        const [peopleRows] = await db.query('SELECT id FROM people WHERE name=?', [personName]);
        let personId;
  
        if (peopleRows.length > 0) {
          personId = peopleRows[0].id;
        } else {
          const [result] = await db.query('INSERT INTO people (name) VALUES (?)', [personName]);
          personId = result.insertId;
        }
  
        await db.query('INSERT INTO photo_people (photo_id, person_id) VALUES (?, ?)', [photoId, personId]);
    }
  
    return { message: 'Foto actualizada exitosamente.' };
  }

  //DELETE PHOTO
  async deletePhoto(id) {
    await Promise.all([
        db.query('DELETE FROM photo_tags WHERE photo_id=?', [id]),
        db.query('DELETE FROM photo_albums WHERE photo_id=?', [id]),
        db.query('DELETE FROM photo_people WHERE photo_id=?', [id]),
    ]);
  
    const [result] = await db.query('DELETE FROM photos WHERE id = ?', [id]);
  
    if (result.affectedRows === 0) {
      return null;
    }
  
    return { message: 'Foto eliminada con éxito' };
  }

  //STREAM PHOTO
  async getPhotoPathByName(name) {
    const [rows] = await db.query('SELECT path FROM photos WHERE name = ?', [name]);
    return rows.length > 0 ? rows[0].path : null;
  }
}

module.exports = PhotoRepositoryMySQL;
