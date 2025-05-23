const db = require("../../models/SQL_xampp");
const MovieRepository = require("./MoviesRepository.interface");
const fs = require("fs");
const config = require("../../config");

class MovieRepositoryMySQL extends MovieRepository {
  //GET ALL MOVIES
  async getAllMovies() {
    const moviesDir = config.MOVIES_DIRECTORY;
    let localFiles = [];

    const query = "SELECT * FROM movies";
    const [rows] = await db.query(query);

    // Get movies that are not in the database
    try {
      localFiles = fs
        .readdirSync(moviesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch (err) {
      console.error("Error leyendo el directorio de películas:", err);
    }

    const dbTitles = rows.map((movie) => movie.title.toLowerCase().trim());

    const missingMovies = localFiles
      .filter((title) => !dbTitles.includes(title.toLowerCase().trim()))
      .map((title) => ({
        title,
      }));

    return [...rows, ...missingMovies];
  }

  //GET ONE MOVIE
  async getMovieByTitle(title) {
    const query = `
      SELECT 
        m.id, 
        m.title, 
        m.subtitle,
        m.description,
        m.imgBanner,
        m.year, 
        m.duration,
        m.rating,
        m.trailer,
        m.path,
        GROUP_CONCAT(DISTINCT d.name SEPARATOR ', ') AS directors,
        GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres,
        GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS actors
      FROM movies m
      LEFT JOIN movie_directors md ON m.id = md.movie_id
      LEFT JOIN directors d ON md.director_id = d.id
      LEFT JOIN movie_genres mg ON m.id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      LEFT JOIN movie_actors ma ON m.id = ma.movie_id
      LEFT JOIN actors a ON ma.actor_id = a.id
      WHERE m.title = ?
      GROUP BY m.id;
    `;

    const [results] = await db.query(query, title);
    if (results.length === 0) return { message: "Pelicula no encontrada." };

    const movie = results[0];

    return {
      id: movie.id,
      title: movie.title,
      subtitle: movie.subtitle,
      description: movie.description,
      imgBanner: movie.imgBanner,
      year: movie.year,
      duration: movie.duration,
      rating: movie.rating,
      trailer: movie.trailer,
      path: movie.path,
      directors: movie.directors ? movie.directors.split(", ") : [],
      genres: movie.genres ? movie.genres.split(", ") : [],
      actors: movie.actors ? movie.actors.split(", ") : [],
    };
  }

  //CREATE MOVIE
  async createMovie(data) {
    const {
      title,
      subtitle,
      description,
      imgBanner,
      year,
      duration,
      rating,
      trailer,
      path,
      directors,
      actors,
      genres,
    } = data;

    const newPath = path.replace(/\\/g, "/").replace(/^["']|["']$/g, "");

    const [existing] = await db.query("SELECT id FROM movies WHERE title = ?", [
      data.title,
    ]);

    if (existing.length > 0) {
      return { message: "Ya existe una película con este título" };
    }

    const [movieResult] = await db.query(
      `INSERT INTO movies 
      (title, subtitle, description, imgBanner, year, duration, rating, trailer, path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        subtitle,
        description,
        imgBanner,
        year,
        duration,
        rating,
        trailer,
        newPath,
      ]
    );

    const movieId = movieResult.insertId;

    if (directors && directors.length > 0) {
      await Promise.all(
        directors.map(async (director) => {
          await db.query(
            "INSERT INTO movie_directors (movie_id, director_id) SELECT ?, id FROM directors WHERE name = ?",
            [movieId, director]
          );
        })
      );
    }

    if (actors && actors.length > 0) {
      await Promise.all(
        actors.map(async (actor) => {
          await db.query(
            "INSERT INTO movie_actors (movie_id, actor_id) SELECT ?, id FROM actors WHERE name = ?",
            [movieId, actor]
          );
        })
      );
    }

    if (genres && genres.length > 0) {
      await Promise.all(
        genres.map(async (genre) => {
          await db.query(
            "INSERT INTO movie_genres (movie_id, genre_id) SELECT ?, id FROM genres WHERE name = ?",
            [movieId, genre]
          );
        })
      );
    }

    return { message: "Película creada con éxito" };
  }

  //UPDATE MOVIE
  async updateMovie(movieTitle, data) {
    const {
      title,
      subtitle,
      description,
      imgBanner,
      year,
      duration,
      rating,
      trailer,
      path,
      directors,
      genres,
      actors,
    } = data;

    const newPath = path.replace(/\\/g, "/").replace(/^["']|["']$/g, "");

    const movieId = (
      await db.query("SELECT id FROM movies WHERE title = ?", [movieTitle])
    )[0][0].id;

    await db.query(
      `
      UPDATE movies SET 
        title=?, subtitle=?, description=?, imgBanner=?, 
        year=?, duration=?, 
        rating=?, trailer=?, path=?
      WHERE id=?`,
      [
        title,
        subtitle,
        description,
        imgBanner,
        year,
        duration,
        rating,
        trailer,
        newPath,
        movieId,
      ]
    );

    await Promise.all([
      db.query("DELETE FROM movie_directors WHERE movie_id=?", [movieId]),
      db.query("DELETE FROM movie_genres WHERE movie_id=?", [movieId]),
      db.query("DELETE FROM movie_actors WHERE movie_id=?", [movieId]),
    ]);

    for (const directorName of directors || []) {
      const [directorRows] = await db.query(
        "SELECT id FROM directors WHERE name=?",
        [directorName]
      );

      let directorId =
        directorRows.length > 0
          ? directorRows[0].id
          : (
              await db.query("INSERT INTO directors (name) VALUES (?)", [
                directorName,
              ])
            )[0].insertId;

      await db.query(
        "INSERT INTO movie_directors (movie_id, director_id) VALUES (?, ?)",
        [movieId, directorId]
      );
    }

    for (const genreName of genres || []) {
      const [genreRows] = await db.query("SELECT id FROM genres WHERE name=?", [
        genreName,
      ]);
      let genreId =
        genreRows.length > 0
          ? genreRows[0].id
          : (
              await db.query("INSERT INTO genres (name) VALUES (?)", [
                genreName,
              ])
            )[0].insertId;

      await db.query(
        "INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)",
        [movieId, genreId]
      );
    }

    for (const actorName of actors || []) {
      const [actorRows] = await db.query("SELECT id FROM actors WHERE name=?", [
        actorName,
      ]);
      let actorId =
        actorRows.length > 0
          ? actorRows[0].id
          : (
              await db.query("INSERT INTO actors (name) VALUES (?)", [
                actorName,
              ])
            )[0].insertId;

      await db.query(
        "INSERT INTO movie_actors (movie_id, actor_id) VALUES (?, ?)",
        [movieId, actorId]
      );
    }

    return { message: "Película actualizada exitosamente." };
  }

  //DELETE MOVIE
  async deleteMovie(title) {
    const movieId = (
      await db.query("SELECT id FROM movies WHERE title = ?", [title])
    )[0][0].id;

    await Promise.all([
      db.query("DELETE FROM movie_directors WHERE movie_id = ?", [movieId]),
      db.query("DELETE FROM movie_genres WHERE movie_id = ?", [movieId]),
      db.query("DELETE FROM movie_actors WHERE movie_id = ?", [movieId]),
    ]);

    const [result] = await db.query("DELETE FROM movies WHERE id = ?", [
      movieId,
    ]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { message: "Película eliminada con éxito" };
  }

  //STREAM MOVIE
  async getMoviePathByTitle(title) {
    const [rows] = await db.query("SELECT path FROM movies WHERE title = ?", [
      title,
    ]);
    return rows.length > 0 ? rows[0].path : null;
  }
}

module.exports = MovieRepositoryMySQL;
