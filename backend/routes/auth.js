const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");

/**
 * @route   POST /auth/register
 * @desc    Registrar nuevo usuario (estudiante o profesor)
 * @access  Public
 * @body    { name, email, password, role? }
 */
router.post("/register", validateRegister, AuthController.register);

/**
 * @route   POST /auth/login
 * @desc    Iniciar sesión
 * @access  Public
 * @body    { email, password }
 */
router.post("/login", validateLogin, AuthController.login);

/**
 * @route   GET /auth/verify
 * @desc    Verificar token JWT válido
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get("/verify", verifyToken, AuthController.verifyToken);

/**
 * @route   POST /auth/logout
 * @desc    Cerrar sesión (registro de logout)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post("/logout", verifyToken, AuthController.logout);

module.exports = router;
