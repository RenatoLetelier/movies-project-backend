const userService = require("../services/usersService");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener las fotos" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error en getUserById:", error);
    res.status(500).json({ message: "Error al obtener la foto" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, path } = req.body;

    if (!name || !path) {
      return res
        .status(400)
        .json({ message: "Nombre y ruta del archivo son requeridos" });
    }

    const result = await userService.createUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Error en createUser:", error);
    res
      .status(500)
      .json({ message: error.message || "Error al crear la foto" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Error en updateUser:", err);
    res.status(500).json({ error: "Error al actualizar la foto." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error en deleteUser:", error);
    res.status(500).json({ message: "Error al eliminar la foto" });
  }
};
