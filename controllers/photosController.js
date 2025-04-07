const db = require('../models/db');
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

        db.query(query, (err, results) => {
            if (err) {
                console.error('Error >>> ', err);
                return res.status(500).json({ error: 'Error al obtener las fotos' });
            }

            // Transformar los datos para que las categorías sean un array
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
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPhotoById = async (req, res) => {
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

        db.query(query, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener la foto con id: ' + req.params.id });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Foto no encontrada' });
            }

            const photo = results[0];
            const filePath = photo.path;
            const fileExists = fs.existsSync(filePath);

            const formattedPhoto = {
                id: photo.id,
                name: photo.name,
                description: photo.description,
                uploadBy: photo.uploadBy,
                isFavorite: !!photo.isFavorite,
                isPrivate: !!photo.isPrivate,
                orientation: photo.orientation,
                path: photo.path,
                fileExists: fileExists,
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
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPhoto = async (req, res) => {
    try {
        const uploadMiddleware = upload.single('photo');

        uploadMiddleware(req, res, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error al subir la foto', error: err.message });
            }

            const { name, description, uploadBy, isFavorite, isPrivate, orientation, location, dimensions, size, photoDate, photoTime, tags, albums, people } = req.body;
            if (!name || !req.file) {
                return res.status(400).json({ message: 'Nombre y archivo son requeridos' });
            }

            const filePath = req.file.path;

            // Insertar en la tabla photos
            db.query('INSERT INTO photos (name, description, uploadBy, isFavorite, isPrivate, orientation, path) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                [name, description, uploadBy, isFavorite, isPrivate, orientation, filePath], 
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error al crear la foto en la base de datos' });
                    }

                    const photoId = result.insertId;

                    // Insertar en metadata
                    db.query('INSERT INTO metadata (photo_id, location, dimensions, size, photoDate, photoTime) VALUES (?, ?, ?, ?, ?, ?)',
                        [photoId, location, dimensions, size, photoDate, photoTime], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error al agregar metadatos' });
                            }
                        });

                    // Insertar en tags
                    if (tags && tags.length > 0) {
                        tags.split(', ').forEach(tag => {
                            db.query('INSERT INTO photo_tags (photo_id, tag_id) SELECT ?, id FROM tags WHERE name = ?', [photoId, tag]);
                        });
                    }

                    // Insertar en albums
                    if (albums && albums.length > 0) {
                        albums.split(', ').forEach(album => {
                            db.query('INSERT INTO photo_albums (photo_id, album_id) SELECT ?, id FROM albums WHERE name = ?', [photoId, album]);
                        });
                    }

                    // Insertar en people
                    if (people && people.length > 0) {
                        people.split(', ').forEach(person => {
                            db.query('INSERT INTO photo_people (photo_id, person_id) SELECT ?, id FROM people WHERE name = ?', [photoId, person]);
                        });
                    }

                    res.status(201).json({ message: 'Foto creada con éxito', photoId: photoId });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePhoto = async (req, res) => {
    try {
        const { id } = req.params;  // El ID de la foto que se va a actualizar
        const { title, category, metadata } = req.body; // Los nuevos datos a actualizar
        
        // Validamos que al menos uno de los campos a actualizar sea enviado
        if (!title && !category && !metadata) {
            return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar' });
        }

        // Consulta SQL para actualizar la foto con la nueva información
        let updateQuery = 'UPDATE photos SET ';
        let updateValues = [];

        // Solo actualizamos el campo si se recibe un nuevo valor
        if (title) {
            updateQuery += 'title = ?, ';
            updateValues.push(title);
        }

        if (category) {
            updateQuery += 'category = ?, ';
            updateValues.push(category);
        }

        if (metadata) {
            updateQuery += 'metadata = ? ';
            updateValues.push(JSON.stringify(metadata));  // Guardamos metadata como JSON
        }

        // Eliminamos la última coma y espacio
        updateQuery = updateQuery.trim().replace(/,$/, '');
        
        // Añadimos el ID de la foto para la cláusula WHERE
        updateQuery += ' WHERE id = ?';
        updateValues.push(id);

        // Ejecutamos la consulta para actualizar la base de datos
        db.query(updateQuery, updateValues, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar la foto' });
            }

            // Si no se encuentra ninguna fila afectada, significa que no hay foto con ese ID
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Foto no encontrada' });
            }

            res.status(200).json({ message: 'Foto actualizada con éxito' });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const deletePhoto = async (req, res) => {
    try {
        const { id } = req.params;
        db.query('DELETE FROM photos WHERE id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar la foto' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Foto no encontrada' });
            }
            res.status(200).json({ message: 'Foto eliminada con éxito' });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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