require("dotenv").config();

module.exports = {
  HOST: process.env.SERVER_HOST || "localhost",
  PORT: process.env.SERVER_PORT || "8000",
  JWT_SECRET: process.env.JWT_SECRET,
  DB_TYPE: process.env.DB_TYPE || "mysql", // 'mongodb' o 'mysql'
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOME_SERVER: process.env.DB_HOME_SERVER,
  DB_MOVIES_NAME: process.env.DB_MOVIES_NAME,
  DB_PHOTOS_NAME: process.env.DB_PHOTOS_NAME,
};
