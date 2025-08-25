const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, role = "student" } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado",
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
      });

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        process.env.JWT_SECRET || "shark_math_game_secret_key_2024",
        { expiresIn: "24h" }
      );

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Error en registro:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log("🔑 Intento de login:", email);

      // Buscar usuario por email
      const user = await User.findByEmail(email);
      if (!user) {
        console.log("❌ Usuario no encontrado:", email);
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      console.log("✅ Usuario encontrado:", user.name);

      const isValidPassword = await User.verifyPassword(
        password,
        user.password
      );
      console.log("🔐 Password válido:", isValidPassword);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        process.env.JWT_SECRET || "shark_math_game_secret_key_2024",
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  static async verifyToken(req, res) {
    try {
      res.json({
        success: true,
        message: "Token válido",
        data: {
          user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
          },
        },
      });
    } catch (error) {
      console.error("Error verificando token:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  static async logout(req, res) {
    try {
      res.json({
        success: true,
        message: "Sesión cerrada exitosamente",
      });
    } catch (error) {
      console.error("Error en logout:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = AuthController;
