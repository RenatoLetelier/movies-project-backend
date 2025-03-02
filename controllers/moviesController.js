const db = require('../models/db');

const getAllMovies = async (req, res) => {
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
            LEFT JOIN genres_v2 g ON mg.genre_id = g.id
            LEFT JOIN movie_actors ma ON m.id = ma.movie_id
            LEFT JOIN actors a ON ma.actor_id = a.id
            GROUP BY m.id;
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error al obtener las películas' });
            }

            // Transformar los datos para que los géneros y actores sean arrays
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
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getMovieById = async (req, res) => {
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
            LEFT JOIN genres_v2 g ON mg.genre_id = g.id
            LEFT JOIN movie_actors ma ON m.id = ma.movie_id
            LEFT JOIN actors a ON ma.actor_id = a.id
            WHERE m.id = ?
            GROUP BY m.id;
        `;

        db.query(query, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener la película' });
            }
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
                fileExists: fileExists,
                genre: movie.genres ? movie.genres.split(', ') : [],
                actors: movie.actors ? movie.actors.split(', ') : []
            };

            res.status(200).json(formattedMovie);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createMovie = async (req, res) => {
    try {
        const { title, subtitle, description, imgBanner, year, director, duration, rating, trailer, genres, actors } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'El título es requerido' });
        }

        try {
            // Insertar en la tabla de movies
            const [result] = await db.promise().query(
                'INSERT INTO movies (title, subtitle, description, imgBanner, year, director, duration, rating, trailer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, subtitle, description, imgBanner, year, director, duration, rating, trailer]
            );

            const movieId = result.insertId;

            // Insertar géneros
            if (genres && genres.length > 0) {
                const genreNames = genres.split(',');
                for (const genre of genreNames) {
                    await db.promise().query(
                        'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, (SELECT id FROM genres_v2 WHERE name = ? LIMIT 1))',
                        [movieId, genre.trim()]
                    );
                }
            }

            // Insertar actores
            if (actors && actors.length > 0) {
                const actorNames = actors.split(',');
                for (const actor of actorNames) {
                    // Verificar si el actor existe
                    const [actorResult] = await db.promise().query(
                        'SELECT id FROM actors WHERE name = ? LIMIT 1',
                        [actor.trim()]
                    );

                    if (actorResult.length > 0) {
                        // Si el actor existe, insertarlo en la tabla movie_actors
                        await db.promise().query(
                            'INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)',
                            [movieId, actorResult[0].id]
                        );
                    } else {
                        // Si el actor no existe, agregarlo primero a la tabla de actores
                        const [newActorResult] = await db.promise().query(
                            'INSERT INTO actors (name) VALUES (?)',
                            [actor.trim()]
                        );
                        // Luego insertar el actor en movie_actors
                        await db.promise().query(
                            'INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)',
                            [movieId, newActorResult.insertId]
                        );
                    }
                }
            }

            res.status(201).json({ message: 'Película creada con éxito', movieId });

        } catch (dbError) {
            res.status(500).json({ error: 'Error al crear la película en la base de datos', details: dbError.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, description, imgBanner, year, director, duration, seen, rating, trailer, genres, actors } = req.body;

        // Verificar si la película existe
        const [movieExists] = await db.promise().query('SELECT id FROM movies WHERE id = ?', [id]);
        if (movieExists.length === 0) {
            return res.status(404).json({ message: 'Película no encontrada' });
        }

        // Construir la consulta de actualización dinámica
        let updateQuery = 'UPDATE movies SET ';
        let updateValues = [];

        if (title) { updateQuery += 'title = ?, '; updateValues.push(title); }
        if (subtitle) { updateQuery += 'subtitle = ?, '; updateValues.push(subtitle); }
        if (description) { updateQuery += 'description = ?, '; updateValues.push(description); }
        if (imgBanner) { updateQuery += 'imgBanner = ?, '; updateValues.push(imgBanner); }
        if (year) { updateQuery += 'year = ?, '; updateValues.push(year); }
        if (director) { updateQuery += 'director = ?, '; updateValues.push(director); }
        if (duration) { updateQuery += 'duration = ?, '; updateValues.push(duration); }
        if (seen !== undefined) { updateQuery += 'seen = ?, '; updateValues.push(seen); }
        if (rating) { updateQuery += 'rating = ?, '; updateValues.push(rating); }
        if (trailer) { updateQuery += 'trailer = ?, '; updateValues.push(trailer); }

        if (updateValues.length > 0) {
            updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
            updateValues.push(id);
            await db.promise().query(updateQuery, updateValues);
        }

        // Actualizar géneros
        if (genres) {
            await db.promise().query('DELETE FROM movie_genres WHERE movie_id = ?', [id]);
            const genreList = genres.split(',').map(g => g.trim());
            for (const genre of genreList) {
                await db.promise().query(
                    'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, (SELECT id FROM genres_v2 WHERE name = ? LIMIT 1))',
                    [id, genre]
                );
            }
        }

        // Actualizar actores
        if (actors) {
            await db.promise().query('DELETE FROM movie_actors WHERE movie_id = ?', [id]);
            const actorList = actors.split(',').map(a => a.trim());
            for (const actor of actorList) {
                await db.promise().query(
                    'INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, (SELECT id FROM actors WHERE name = ? LIMIT 1))',
                    [id, actor]
                );
            }
        }

        res.status(200).json({ message: 'Película actualizada con éxito' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;

        db.query('DELETE FROM movies WHERE id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar la película' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Película no encontrada' });
            }
            res.status(200).json({ message: 'Película eliminada con éxito' });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie };