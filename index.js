const express = require("express");
const cors = require("cors");
require("dotenv").config();

const config = require("./config");
const apiRoutes = require("./routes");

const app = express();

app.use(
  cors({
    origin: `http://${config.HOST}:5173`,
    credentials: true,
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());
app.use("/api", apiRoutes);
app.use("/api/static/banners", express.static("D:/Movies/Banners"));
app.use("/api/static/movies", express.static("D:/Movies/Peliculas"));

// Home route
app.get("/", (req, res) => {
  res.send("Home server working correctly!");
});

// Error route
app.get("*", (req, res) => {
  res.send("Error page, please come back /home.");
});

// Start server
app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://${config.HOST}:${config.PORT}`);
});
