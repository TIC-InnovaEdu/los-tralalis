const express = require("express");
const router = express.Router();

const LevelsController = require("../controllers/levelsController");
const { verifyToken, requireTeacher } = require("../middleware/auth");
const { validateId } = require("../middleware/validation");

// ===== RUTAS DE NIVELES =====

/**
 * @route   GET /levels
 * @desc    Obtener todos los niveles configurados
 * @access  Private (solo profesores)
 */
router.get("/", verifyToken, requireTeacher, LevelsController.getAllLevels);

/**
 * @route   POST /levels
 * @desc    Crear nuevo nivel
 * @access  Private (solo profesores)
 */
router.post("/", verifyToken, requireTeacher, LevelsController.createLevel);

/**
 * @route   PUT /levels/:levelNumber
 * @desc    Actualizar nivel existente
 * @access  Private (solo profesores)
 */
router.put("/:levelNumber", verifyToken, requireTeacher, LevelsController.updateLevel);

/**
 * @route   DELETE /levels/:levelNumber
 * @desc    Eliminar nivel
 * @access  Private (solo profesores)
 */
router.delete("/:levelNumber", verifyToken, requireTeacher, LevelsController.deleteLevel);

/**
 * @route   GET /levels/users
 * @desc    Obtener niveles de todos los usuarios
 * @access  Private (solo profesores)
 */
router.get("/users", verifyToken, requireTeacher, LevelsController.getAllUsersLevels);

// ===== RUTAS DE LOGROS =====

/**
 * @route   GET /levels/achievements
 * @desc    Obtener todos los logros
 * @access  Private (solo profesores)
 */
router.get("/achievements", verifyToken, requireTeacher, LevelsController.getAllAchievements);

/**
 * @route   POST /levels/achievements
 * @desc    Crear nuevo logro
 * @access  Private (solo profesores)
 */
router.post("/achievements", verifyToken, requireTeacher, LevelsController.createAchievement);

/**
 * @route   PUT /levels/achievements/:id
 * @desc    Actualizar logro existente
 * @access  Private (solo profesores)
 */
router.put("/achievements/:id", verifyToken, requireTeacher, validateId, LevelsController.updateAchievement);

/**
 * @route   DELETE /levels/achievements/:id
 * @desc    Eliminar logro
 * @access  Private (solo profesores)
 */
router.delete("/achievements/:id", verifyToken, requireTeacher, validateId, LevelsController.deleteAchievement);

/**
 * @route   GET /levels/achievements/user/:userId
 * @desc    Obtener logros de un usuario específico
 * @access  Private (solo profesores)
 */
router.get("/achievements/user/:userId", verifyToken, requireTeacher, validateId, LevelsController.getUserAchievements);

/**
 * @route   POST /levels/achievements/grant
 * @desc    Otorgar logro manualmente a un usuario
 * @access  Private (solo profesores)
 */
router.post("/achievements/grant", verifyToken, requireTeacher, LevelsController.grantAchievement);

/**
 * @route   POST /levels/achievements/check/:userId
 * @desc    Verificar y otorgar logros automáticamente
 * @access  Private (solo profesores)
 */
router.post("/achievements/check/:userId", verifyToken, requireTeacher, validateId, LevelsController.checkAndGrantAchievements);

/**
 * @route   GET /levels/achievements/stats
 * @desc    Obtener estadísticas de logros
 * @access  Private (solo profesores)
 */
router.get("/achievements/stats", verifyToken, requireTeacher, LevelsController.getAchievementStats);

// ===== RUTAS DE EXPERIENCIA =====

/**
 * @route   POST /levels/experience/:userId
 * @desc    Agregar experiencia a un usuario
 * @access  Private (solo profesores)
 */
router.post("/experience/:userId", verifyToken, requireTeacher, validateId, LevelsController.addExperience);

/**
 * @route   GET /levels/progress/:userId
 * @desc    Obtener progreso de nivel de un usuario
 * @access  Private (solo profesores)
 */
router.get("/progress/:userId", verifyToken, requireTeacher, validateId, LevelsController.getUserLevelProgress);

// ===== RUTAS DE PREMIOS =====

/**
 * @route   GET /levels/rewards
 * @desc    Obtener todos los premios
 * @access  Private (solo profesores)
 */
router.get("/rewards", verifyToken, requireTeacher, LevelsController.getAllRewards);

/**
 * @route   POST /levels/rewards
 * @desc    Crear nuevo premio
 * @access  Private (solo profesores)
 */
router.post("/rewards", verifyToken, requireTeacher, LevelsController.createReward);

/**
 * @route   PUT /levels/rewards/:id
 * @desc    Actualizar premio existente
 * @access  Private (solo profesores)
 */
router.put("/rewards/:id", verifyToken, requireTeacher, validateId, LevelsController.updateReward);

/**
 * @route   DELETE /levels/rewards/:id
 * @desc    Eliminar premio
 * @access  Private (solo profesores)
 */
router.delete("/rewards/:id", verifyToken, requireTeacher, validateId, LevelsController.deleteReward);

/**
 * @route   GET /levels/rewards/user/:userId
 * @desc    Obtener premios de un usuario específico
 * @access  Private (solo profesores)
 */
router.get("/rewards/user/:userId", verifyToken, requireTeacher, validateId, LevelsController.getUserRewards);

/**
 * @route   POST /levels/rewards/redeem
 * @desc    Canjear premio
 * @access  Private (solo profesores)
 */
router.post("/rewards/redeem", verifyToken, requireTeacher, LevelsController.redeemReward);

/**
 * @route   GET /levels/rewards/stats
 * @desc    Obtener estadísticas de premios
 * @access  Private (solo profesores)
 */
router.get("/rewards/stats", verifyToken, requireTeacher, LevelsController.getRewardStats);

module.exports = router;