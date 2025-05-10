const userService = require("../services/usersService");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el usuario" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Nombre de usuario es requeridos" });
    }

    const result = await userService.createUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Error en createUser:", error);
    res
      .status(500)
      .json({ message: error.message || "Error al crear el usuario" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params.id;
  try {
    const result = await userService.updateUser(id, req.body);
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
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error en deleteUser:", error);
    res.status(500).json({ message: "Error al eliminar el usuario" });
  }
};
