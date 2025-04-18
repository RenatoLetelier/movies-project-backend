// repositories/movieRepository.mongo.js
const MovieRepository = require('./movieRepository.interface');
const { getMongoDB } = require('../db/mongo');

class MovieRepositoryMongo extends MovieRepository {
  async getAllMovies() {
    const db = await getMongoDB();
    return db.collection('movies').aggregate([
      {
        $lookup: {
          from: 'actors',
          localField: 'actorIds',
          foreignField: '_id',
          as: 'actors'
        }
      },
      {
        $lookup: {
          from: 'genres',
          localField: 'genreIds',
          foreignField: '_id',
          as: 'genres'
        }
      }
    ]).toArray();
  }
}

module.exports = MovieRepositoryMongo;
