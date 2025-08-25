const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware para verificar JWT
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
      });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
      });
    }

    // Verificar el token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "shark_math_game_secret_key_2024"
    );

    // Buscar el usuario
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Agregar información del usuario a la request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

// Middleware para verificar que el usuario sea profesor
const requireTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren permisos de profesor",
    });
  }
  next();
};

// Middleware para verificar que el usuario sea estudiante
const requireStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren permisos de estudiante",
    });
  }
  next();
};

// Middleware para verificar que el usuario acceda solo a sus propios datos
const requireOwnership = (req, res, next) => {
  const requestedUserId = parseInt(req.params.id || req.params.user_id);
  const currentUserId = req.user.id;

  // Los profesores pueden acceder a datos de cualquier estudiante
  if (req.user.role === "teacher") {
    return next();
  }

  // Los estudiantes solo pueden acceder a sus propios datos
  if (currentUserId !== requestedUserId) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Solo puedes acceder a tus propios datos",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  requireTeacher,
  requireStudent,
  requireOwnership,
};
