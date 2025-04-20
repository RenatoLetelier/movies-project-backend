const authService = require("../services/authService");

exports.signup = async (req, res) => {
  try {
    const authSignup = await authService.signup(req.body);
    res.status(200).json(authSignup);
  } catch (err) {
    res.status(500).json({ error: "Error al registrarse" });
  }
};

exports.signin = async (req, res) => {
  try {
    const authSignin = await authService.signin(req.body);
    res.status(200).json(authSignin);
  } catch (err) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};
