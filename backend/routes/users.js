const express = require("express");
const router = express.Router();

const UserController = require("../controllers/userController");
const { verifyToken, requireOwnership } = require("../middleware/auth");
const {
  validateUpdateUser,
  validateUpdateUserById,
  validateId,
} = require("../middleware/validation");

/**
 * @route   GET /users/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get("/me", verifyToken, UserController.getMyProfile);

/**
 * @route   PUT /users/me
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { name?, email? }
 */
router.put(
  "/me",
  verifyToken,
  validateUpdateUser,
  UserController.updateMyProfile
);

/**
 * @route   GET /users/:id
 * @desc    Obtener perfil de usuario por ID
 * @access  Private (solo propios datos o profesor)
 * @headers Authorization: Bearer <token>
 * @params  id - ID del usuario
 */
router.get(
  "/:id",
  verifyToken,
  validateId,
  requireOwnership,
  UserController.getProfile
);

/**
 * @route   PUT /users/:id
 * @desc    Actualizar perfil de usuario por ID
 * @access  Private (solo propios datos)
 * @headers Authorization: Bearer <token>
 * @params  id - ID del usuario
 * @body    { name?, email? }
 */
router.put(
  "/:id",
  verifyToken,
  validateUpdateUserById,
  requireOwnership,
  UserController.updateProfile
);

module.exports = router;
