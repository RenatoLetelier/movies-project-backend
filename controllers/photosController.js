const connectDB = require('../models/db');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const getAllPhotos = async (req, res) => {
    const db = await connectDB();
    try {
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
            GROUP BY p.id, m.location, m.dimensions, m.size, m.photoDate, m.photoTime;
        `;

        const [results] = await db.query(query);

        const formattedResults = results.map(photo => ({
            id: photo.id,
            name: photo.name,
            description: photo.description,
            uploadBy: photo.uploadBy,
            isFavorite: !!photo.isFavorite,
            isPrivate: !!photo.isPrivate,
            orientation: photo.orientation,
            path: photo.path,
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
        }));

        res.status(200).json(formattedResults);

    } catch (error) {
        console.error('Error >>> ', error);
        res.status(500).json({ message: 'Error al obtener las fotos' });
    }
};

const getPhotoById = async (req, res) => {
    const db = await connectDB();
    try {
        const { id } = req.params;

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

        const [results] = await db.query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Foto no encontrada' });
        }

        const photo = results[0];
        const fileExists = fs.existsSync(photo.path);

        const formattedPhoto = {
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

        res.status(200).json(formattedPhoto);

    } catch (error) {
        console.error('Error >>> ', error);
        res.status(500).json({ message: 'Error al obtener la foto' });
    }
};

const createPhoto = async (req, res) => {
    const db = await connectDB();
    try {
        const { name, description, uploadBy, isFavorite, isPrivate, orientation, path, tags, albums, metadata } = req.body;

        if (!name || !path) {
            return res.status(400).json({ message: 'Nombre y ruta del archivo son requeridos' });
        }

        // Insertar en la tabla photos
        const [photoResult] = await db.query(
            'INSERT INTO photos (name, description, uploadBy, isFavorite, isPrivate, orientation, path) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, uploadBy, isFavorite, isPrivate, orientation, path]
        );

        const photoId = photoResult.insertId;

        // Insertar en metadata
        await db.query(
            'INSERT INTO metadata (photo_id, location, dimensions, size, photoDate, photoTime) VALUES (?, ?, ?, ?, ?, ?)',
            [photoId, metadata.location, metadata.dimensions, metadata.size, metadata.photoDate, metadata.photoTime]
        );

        // Insertar en tags
        if (tags && tags.length > 0) {
            await Promise.all(tags.map(async (tag) => {
                await db.query('INSERT INTO photo_tags (photo_id, tag_id) SELECT ?, id FROM tags WHERE name = ?', [photoId, tag]);
            }));
        }

        // Insertar en albums
        if (albums && albums.length > 0) {
            await Promise.all(albums.map(async (album) => {
                await db.query('INSERT INTO photo_albums (photo_id, album_id) SELECT ?, id FROM albums WHERE name = ?', [photoId, album]);
            }));
        }

        // Insertar en people
        if (metadata.people && metadata.people.length > 0) {
            await Promise.all(metadata.people.map(async (person) => {
                await db.query('INSERT INTO photo_people (photo_id, person_id) SELECT ?, id FROM people WHERE name = ?', [photoId, person]);
            }));
        }

        res.status(201).json({ message: 'Foto creada con éxito', photoId });

    } catch (error) {
        console.error('Error >>> ', error);
        res.status(500).json({ message: error.message || 'Error al crear la foto', error });
    }
};

const updatePhoto = async (req, res) => {
    const db = await connectDB();
    const photoId = req.params.id;
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
    } = req.body;
  
    try {
      // 1. Actualizar tabla photos
      await db.query(`
        UPDATE photos SET 
          name=?, description=?, uploadBy=?, 
          isFavorite=?, isPrivate=?, orientation=?, path=?
        WHERE id=?`,
        [name, description, uploadBy, isFavorite, isPrivate, orientation, path, photoId]
      );
  
      // 2. Actualizar tabla metadata
      await db.query(`
        UPDATE metadata SET 
          location=?, dimensions=?, size=?, photoDate=?, photoTime=?
        WHERE photo_id=?`,
        [metadata.location, metadata.dimensions, metadata.size, metadata.photoDate, metadata.photoTime, photoId]
      );
  
      // 3. Limpiar relaciones existentes (photos_tags, photos_album, photos_people)
      await Promise.all([
        db.query('DELETE FROM photo_tags WHERE photo_id=?', [photoId]),
        db.query('DELETE FROM photo_albums WHERE photo_id=?', [photoId]),
        db.query('DELETE FROM photo_people WHERE photo_id=?', [photoId]),
      ]);
  
      // 4. Insertar nuevas relaciones: tags
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
  
      // 5. Insertar nuevas relaciones: albums
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
  
      // 6. Insertar nuevas relaciones: people
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
  
      res.status(200).json({ message: 'Foto actualizada exitosamente.' });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar la foto.' });
    }
  };

const deletePhoto = async (req, res) => {
    const db = await connectDB();
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM photos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Foto no encontrada' });
        }

        res.status(200).json({ message: 'Foto eliminada con éxito' });

    } catch (error) {
        console.error('Error >>> ', error);
        res.status(500).json({ message: 'Error al eliminar la foto', error });
    }
};

const getImage = (req, res) => {
    const fileName = req.params.name;
    const imgRute = path.join(__dirname, '../uploads', fileName);
  
    res.sendFile(imgRute, err => {
      if (err) {
        res.status(404).send('Imagen no encontrada.');
      }
    });
};

module.exports = {getAllPhotos, getPhotoById, getImage, createPhoto, updatePhoto, deletePhoto};