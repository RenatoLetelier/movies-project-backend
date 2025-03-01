const db = require('../models/db');

const getAllPhotos = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.uploadBy, 
                p.isSecret, 
                p.isFavorite, 
                p.orientation, 
                p.path,
                GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS categories,
                m.year, 
                m.location, 
                m.people, 
                m.photoDate, 
                m.photoTime, 
                m.description
            FROM photos p
            LEFT JOIN categories c ON p.id = c.photo_id
            LEFT JOIN metadata m ON p.id = m.photo_id
            GROUP BY p.id, m.id;
        `;

        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener las fotos' });
            }

            // Transformar los datos para que las categorías sean un array
            const formattedResults = results.map(photo => ({
                id: photo.id,
                name: photo.name,
                uploadBy: photo.uploadBy,
                isSecret: !!photo.isSecret,
                isFavorite: !!photo.isFavorite,
                orientation: photo.orientation,
                path: photo.path,
                category: photo.categories ? photo.categories.split(', ') : [],
                metadata: {
                    year: photo.year,
                    location: photo.location,
                    people: photo.people ? photo.people.split(', ') : [],
                    photoDate: photo.photoDate,
                    photoTime: photo.photoTime,
                    description: photo.description
                }
            }));

            res.status(200).json(formattedResults);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const path = require('path');
const fs = require('fs');

const getPhotoById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.uploadBy, 
                p.isSecret, 
                p.isFavorite, 
                p.orientation, 
                p.path,
                GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS categories,
                m.year, 
                m.location, 
                m.people, 
                m.photoDate, 
                m.photoTime, 
                m.description
            FROM photos p
            LEFT JOIN categories c ON p.id = c.photo_id
            LEFT JOIN metadata m ON p.id = m.photo_id
            WHERE p.id = ?
            GROUP BY p.id, m.id;
        `;

        db.query(query, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener la foto' });
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
                uploadBy: photo.uploadBy,
                isSecret: !!photo.isSecret,
                isFavorite: !!photo.isFavorite,
                orientation: photo.orientation,
                path: photo.path,
                fileExists: fileExists,
                category: photo.categories ? photo.categories.split(', ') : [],
                metadata: {
                    year: photo.year,
                    location: photo.location,
                    people: photo.people ? photo.people.split(', ') : [],
                    photoDate: photo.photoDate,
                    photoTime: photo.photoTime,
                    description: photo.description
                }
            };

            res.status(200).json(formattedPhoto);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const seePhoto = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT path 
            FROM photos 
            WHERE id = ?
        `;

        db.query(query, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener la foto' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Foto no encontrada' });
            }

            const filePath = results[0].path;

            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            } else {
                return res.status(404).json({ message: 'Archivo de la foto no encontrado' });
            }
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

            const { title } = req.body;
            if (!title || !req.file) {
                return res.status(400).json({ message: 'Título y archivo son requeridos' });
            }

            const filePath = req.file.path;

            db.query('INSERT INTO photos (title, url) VALUES (?, ?)', [title, filePath], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al crear la foto en la base de datos' });
                }
                res.status(201).json({ message: 'Foto creada con éxito', photoId: result.insertId });
            });
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

module.exports = {getAllPhotos, getPhotoById, seePhoto, createPhoto, updatePhoto, deletePhoto};