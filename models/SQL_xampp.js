const mysql = require("mysql2/promise");
const config = require("../config");

let pool;

try {
  pool = mysql.createPool({
    host: config.DB_HOST,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_HOME_SERVER,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
  });

  // Test de conexión inmediata
  pool
    .getConnection()
    .then((connection) => {
      console.log("✅ Conexión a la base de datos establecida correctamente.");
      connection.release();
    })
    .catch((err) => {
      console.error("❌ Error al conectar a la base de datos:", err.message);
    });
} catch (error) {
  console.error("❌ Error al crear el pool de conexiones:", error.message);
}

module.exports = pool;
