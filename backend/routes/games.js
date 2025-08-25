const express = require("express");
const router = express.Router();

const GameController = require("../controllers/gameController");
const { verifyToken, requireOwnership } = require("../middleware/auth");
const {
  validateCreateGame,
  validateGameConsistency,
  validateUserId,
  validateGameId,
} = require("../middleware/validation");

/**
 * @route   POST /games
 * @desc    Guardar una nueva partida
 * @access  Private (estudiantes)
 * @headers Authorization: Bearer <token>
 * @body    { user_id, score, correct_answers, wrong_answers, total_questions, duration, questions[] }
 */
router.post(
  "/",
  verifyToken,
  validateCreateGame,
  validateGameConsistency,
  GameController.createGame
);

/**
 * @route   GET /games/my-games
 * @desc    Obtener historial de partidas del usuario autenticado
 * @access  Private (estudiantes)
 * @headers Authorization: Bearer <token>
 * @query   limit? - número máximo de partidas a devolver (default: 50)
 */
router.get("/my-games", verifyToken, GameController.getMyGames);

/**
 * @route   GET /games/my-games/:game_id
 * @desc    Obtener detalles de una partida específica del usuario autenticado
 * @access  Private (estudiantes)
 * @headers Authorization: Bearer <token>
 * @params  game_id - ID de la partida
 */
router.get(
  "/my-games/:game_id",
  verifyToken,
  validateGameId,
  GameController.getMyGameDetails
);

/**
 * @route   GET /games/:user_id
 * @desc    Obtener historial de partidas de un usuario específico
 * @access  Private (solo propios datos o profesor)
 * @headers Authorization: Bearer <token>
 * @params  user_id - ID del usuario
 * @query   limit? - número máximo de partidas a devolver (default: 50)
 */
router.get(
  "/:user_id",
  verifyToken,
  validateUserId,
  requireOwnership,
  GameController.getUserGames
);

/**
 * @route   GET /games/:user_id/:game_id
 * @desc    Obtener detalles de una partida específica de un usuario
 * @access  Private (solo propios datos o profesor)
 * @headers Authorization: Bearer <token>
 * @params  user_id - ID del usuario
 * @params  game_id - ID de la partida
 */
router.get(
  "/:user_id/:game_id",
  verifyToken,
  validateUserId,
  validateGameId,
  requireOwnership,
  GameController.getGameDetails
);

module.exports = router;
