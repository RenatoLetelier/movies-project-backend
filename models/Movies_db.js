const mysql = require('mysql2/promise');
require('dotenv').config();

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_MOVIES_NAME
    });
    return connection;
  } catch (err) {
    console.error('Error de conexión:', err);
    throw err;
  }
};

module.exports = connectDB;