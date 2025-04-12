const connectDB = require('../models/Movies_db');
const fs = require('fs');
const { console } = require('inspector');
const path = require('path');

const getAllMovies = async (req, res) => {
    const db = await connectDB();
    try {
        const query = `
            SELECT 
                m.id, 
                m.title, 
                m.subtitle,
                m.description,
                m.imgBanner,
                m.year, 
                m.director, 
                m.duration, 
                m.seen,
                m.rating,
                m.trailer,
                m.path,
                GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS actors
            FROM movies m
            LEFT JOIN movie_genres mg ON m.id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.id
            LEFT JOIN movie_actors ma ON m.id = ma.movie_id
            LEFT JOIN actors a ON ma.actor_id = a.id
            GROUP BY m.id;
        `;

        const [results] = await db.query(query);

        const formattedResults = results.map(movie => ({
            id: movie.id,
            title: movie.title,
            subtitle: movie.subtitle,
            description: movie.description,
            imgBanner: movie.imgBanner,
            year: movie.year,
            director: movie.director,
            duration: movie.duration,
            seen: !!movie.seen,
            rating: movie.rating,
            trailer: movie.trailer,
            path: movie.path,
            genre: movie.genres ? movie.genres.split(', ') : [],
            actors: movie.actors ? movie.actors.split(', ') : []
        }));

        res.status(200).json(formattedResults);

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las películas' });
    }
};

const getMovieById = async (req, res) => {
    const db = await connectDB();
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                m.id, 
                m.title, 
                m.subtitle,
                m.description,
                m.imgBanner,
                m.year, 
                m.director, 
                m.duration, 
                m.seen,
                m.rating,
                m.trailer,
                m.path,
                GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres,
                GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS actors
            FROM movies m
            LEFT JOIN movie_genres mg ON m.id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.id
            LEFT JOIN movie_actors ma ON m.id = ma.movie_id
            LEFT JOIN actors a ON ma.actor_id = a.id
            WHERE m.id = ?
            GROUP BY m.id;
        `;

        const [results] = await db.query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Película no encontrada' });
        }

        const movie = results[0];
        const fileExists = fs.existsSync(movie.path);

        const formattedMovie = {
            id: movie.id,
            title: movie.title,
            subtitle: movie.subtitle,
            description: movie.description,
            imgBanner: movie.imgBanner,
            year: movie.year,
            director: movie.director,
            duration: movie.duration,
            seen: !!movie.seen,
            rating: movie.rating,
            trailer: movie.trailer,
            path: movie.path,
            fileExists,
            genre: movie.genres ? movie.genres.split(', ') : [],
            actors: movie.actors ? movie.actors.split(', ') : []
        };

        res.status(200).json(formattedMovie);

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la película' });
    }
};

const createMovie = async (req, res) => {
    const db = await connectDB();
    try {
        const {
            title, subtitle, description, imgBanner, year,
            director, duration, seen, rating, trailer, path,
            actors, genres
        } = req.body;

        if (!title || !path) {
            return res.status(400).json({ message: 'Título y ruta del archivo son requeridos' });
        }

        // Insertar en movies
        const [movieResult] = await db.query(
            `INSERT INTO movies 
            (title, subtitle, description, imgBanner, year, director, duration, seen, rating, trailer, path) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, subtitle, description, imgBanner, year, director, duration, seen, rating, trailer, path]
        );

        const movieId = movieResult.insertId;

        // Insertar en movies_actors
        if (actors && actors.length > 0) {
            await Promise.all(actors.map(async (actor) => {
                await db.query(
                    'INSERT INTO movie_actors (movie_id, actor_id) SELECT ?, id FROM actors WHERE name = ?',
                    [movieId, actor]
                );
            }));
        }

        // Insertar en movies_genres
        if (genres && genres.length > 0) {
            await Promise.all(genres.map(async (genre) => {
                await db.query(
                    'INSERT INTO movie_genres (movie_id, genre_id) SELECT ?, id FROM genres WHERE name = ?',
                    [movieId, genre]
                );
            }));
        }

        res.status(201).json({ message: 'Película creada con éxito', movieId });

    } catch (error) {
        console.error('Error >>> ', error);
        res.status(500).json({ message: error.message || 'Error al crear la película', error });
    }
};

const updateMovie = async (req, res) => {
    const db = await connectDB();
    const movieId = req.params.id;
    const {
      title,
      subtitle,
      description,
      imgBanner,
      year,
      director,
      duration,
      seen,
      rating,
      trailer,
      path,
      genres,
      actors
    } = req.body;
  
    try {
      // 1. Actualizar tabla movies
      await db.query(`
        UPDATE movies SET 
          title=?, subtitle=?, description=?, imgBanner=?, 
          year=?, director=?, duration=?, seen=?, 
          rating=?, trailer=?, path=?
        WHERE id=?`,
        [
          title, subtitle, description, imgBanner,
          year, director, duration, seen,
          rating, trailer, path, movieId
        ]
      );
  
      // 2. Limpiar relaciones existentes
      await Promise.all([
        db.query('DELETE FROM movie_genres WHERE movie_id=?', [movieId]),
        db.query('DELETE FROM movie_actors WHERE movie_id=?', [movieId])
      ]);
  
      // 3. Insertar géneros nuevos (si no existen) y relacionarlos
      for (const genreName of genres) {
        const [genreRows] = await db.query('SELECT id FROM genres WHERE name=?', [genreName]);
        let genreId;
  
        if (genreRows.length > 0) {
          genreId = genreRows[0].id;
        } else {
          const [result] = await db.query('INSERT INTO genres (name) VALUES (?)', [genreName]);
          genreId = result.insertId;
        }
  
        await db.query('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [movieId, genreId]);
      }
  
      // 4. Insertar actores nuevos (si no existen) y relacionarlos
      for (const actorName of actors) {
        const [actorRows] = await db.query('SELECT id FROM actors WHERE name=?', [actorName]);
        let actorId;
  
        if (actorRows.length > 0) {
          actorId = actorRows[0].id;
        } else {
          const [result] = await db.query('INSERT INTO actors (name) VALUES (?)', [actorName]);
          actorId = result.insertId;
        }
  
        await db.query('INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)', [movieId, actorId]);
      }
  
      res.status(200).json({ message: 'Película actualizada exitosamente.' });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar la película.' });
    }
  };

  const deleteMovie = async (req, res) => {
    const db = await connectDB();
    try {
        const { id } = req.params;

        // Eliminar relaciones en tablas intermedias primero
        await Promise.all([
            db.query('DELETE FROM movie_genres WHERE movie_id = ?', [id]),
            db.query('DELETE FROM movie_actors WHERE movie_id = ?', [id])
        ]);

        // Luego eliminar la película
        const [result] = await db.query('DELETE FROM movies WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Película no encontrada' });
        }

        res.status(200).json({ message: 'Película eliminada con éxito' });

    } catch (error) {
        console.error('Error >>> ', error);
        res.status(500).json({ message: 'Error al eliminar la película', error });
    }
};

const streamMovieByTitle = async (req, res) => {
    const db = await connectDB();
    const { id } = req.params;

    
    if (!id) {
        return res.status(400).json({ message: 'El id es requerido' });
    }
    
    try {
        const [rows] = await db.query(
            'SELECT path FROM movies WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Película no encontrada en la base de datos' });
        }

        const moviePath = rows[0].path;

        if (!fs.existsSync(moviePath)) {
            return res.status(404).send('El archivo de la película no existe en el sistema.');
        }

        const stat = fs.statSync(moviePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunkSize = end - start + 1;
            const file = fs.createReadStream(moviePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(200, head);
            fs.createReadStream(moviePath).pipe(res);
        }

    } catch (error) {
        res.status(500).json({ message: 'Error al hacer streaming de la película' });
    }
};

module.exports = { getAllMovies, getMovieById, streamMovieByTitle, createMovie, updateMovie, deleteMovie };