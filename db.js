const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'renato',
  password: 'Warena.,123',
  database: 'movies_project'
});

connection.connect(err => {
  if (err) {
    console.error('Error de conexión:', err);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = connection;
