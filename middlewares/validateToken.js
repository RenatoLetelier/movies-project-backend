import jwt from "jsonwebtoken";
import config from "../config.js";

export const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token no proporcionado o formato incorrecto" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "El token ha expirado" });
      }
      return res.status(401).json({ error: "Token inválido" });
    }

    req.user = decoded;
    next();
  });
};
