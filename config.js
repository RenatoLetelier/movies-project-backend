require('dotenv').config();

module.exports = {
  DB_TYPE: process.env.DB_TYPE || 'mysql', // 'mongodb' o 'mysql'
};