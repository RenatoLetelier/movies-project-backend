const db = require('../models/Movies_db');
const MovieRepository = require('./MoviesRepository.interface');
const fs = require('fs');

class MovieRepositoryMySQL extends MovieRepository {
  //GET ALL MOVIES
  async getAllMovies() {
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
    const [rows] = await db.query(query);
    return rows;
  }

  //GET ONE MOVIE
  async getMovieById(id) {
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

    const [results] = await db.query(query, id);
    if (results.length === 0) return null;

    const movie = results[0];
    const fileExists = fs.existsSync(movie.path);

    return {
      id: movie.id,
      title: movie.title,
      subtitle: movie.subtitle,
      description: movie.description,
      imgBanner: movie.imgBanner,
      year: movie.year,
      director: movie.director,
      duration: movie.duration,
      rating: movie.rating,
      trailer: movie.trailer,
      path: movie.path,
      fileExists,
      genre: movie.genres ? movie.genres.split(', ') : [],
      actors: movie.actors ? movie.actors.split(', ') : []
    };
  }

  //CREATE MOVIE
  async createMovie(data) {
    const {
      title, subtitle, description, imgBanner, year,
      director, duration, rating, trailer, path,
      actors, genres
    } = data;

    const [existing] = await db.query('SELECT id FROM movies WHERE title = ?', [data.title]);
    if (existing.length > 0) {
      throw new Error('Ya existe una película con este título');
    }
  
    const [movieResult] = await db.query(
      `INSERT INTO movies 
      (title, subtitle, description, imgBanner, year, director, duration, rating, trailer, path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle, description, imgBanner, year, director, duration, rating, trailer, path]
    );
  
    const movieId = movieResult.insertId;
  
    if (actors && actors.length > 0) {
      await Promise.all(actors.map(async (actor) => {
        await db.query(
          'INSERT INTO movie_actors (movie_id, actor_id) SELECT ?, id FROM actors WHERE name = ?',
          [movieId, actor]
        );
      }));
    }
  
    if (genres && genres.length > 0) {
      await Promise.all(genres.map(async (genre) => {
        await db.query(
          'INSERT INTO movie_genres (movie_id, genre_id) SELECT ?, id FROM genres WHERE name = ?',
          [movieId, genre]
        );
      }));
    }
  
    return { movieId, message: 'Película creada con éxito' };
  }

  //UPDATE MOVIE
  async updateMovie(movieId, data) {
    const {
      title,
      subtitle,
      description,
      imgBanner,
      year,
      director,
      duration,
      rating,
      trailer,
      path,
      genres,
      actors
    } = data;
  
    await db.query(`
      UPDATE movies SET 
        title=?, subtitle=?, description=?, imgBanner=?, 
        year=?, director=?, duration=?, 
        rating=?, trailer=?, path=?
      WHERE id=?`,
      [
        title, subtitle, description, imgBanner,
        year, director, duration,
        rating, trailer, path, movieId
      ]
    );
  
    await Promise.all([
      db.query('DELETE FROM movie_genres WHERE movie_id=?', [movieId]),
      db.query('DELETE FROM movie_actors WHERE movie_id=?', [movieId])
    ]);
  
    for (const genreName of genres || []) {
      const [genreRows] = await db.query('SELECT id FROM genres WHERE name=?', [genreName]);
      let genreId = genreRows.length > 0
        ? genreRows[0].id
        : (await db.query('INSERT INTO genres (name) VALUES (?)', [genreName]))[0].insertId;
  
      await db.query('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [movieId, genreId]);
    }
  
    for (const actorName of actors || []) {
      const [actorRows] = await db.query('SELECT id FROM actors WHERE name=?', [actorName]);
      let actorId = actorRows.length > 0
        ? actorRows[0].id
        : (await db.query('INSERT INTO actors (name) VALUES (?)', [actorName]))[0].insertId;
  
      await db.query('INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)', [movieId, actorId]);
    }
  
    return { message: 'Película actualizada exitosamente.' };
  }

  //DELETE MOVIE
  async deleteMovie(id) {
    await Promise.all([
      db.query('DELETE FROM movie_genres WHERE movie_id = ?', [id]),
      db.query('DELETE FROM movie_actors WHERE movie_id = ?', [id])
    ]);
  
    const [result] = await db.query('DELETE FROM movies WHERE id = ?', [id]);
  
    if (result.affectedRows === 0) {
      return null;
    }
  
    return { message: 'Película eliminada con éxito' };
  }

  //STREAM MOVIE
  async getMoviePathById(id) {
    const [rows] = await db.query('SELECT path FROM movies WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0].path : null;
  }
}

module.exports = MovieRepositoryMySQL;
