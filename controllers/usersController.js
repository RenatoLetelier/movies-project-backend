const userService = require("../services/usersService");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Id de usuario es requerido" });
  }

  try {
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
  const { username, password } = req.body;
  if (!username || !password) {
    return { message: "Nombre de usuario y contraseña son requeridos" };
  }

  try {
    const result = await userService.createUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el usuario" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params.id;
  if (!id) {
    return res.status(400).json({ message: "Id de usuario es requerido" });
  }

  try {
    const result = await userService.updateUser(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la foto." });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Id de usuario es requerido" });
  }

  try {
    const result = await userService.deleteUser(id);

    if (!result) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el usuario" });
  }
};
