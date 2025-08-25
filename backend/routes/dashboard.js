const express = require("express");
const router = express.Router();

const DashboardController = require("../controllers/dashboardController");
const { verifyToken, requireTeacher } = require("../middleware/auth");
const { validateId } = require("../middleware/validation");

/**
 * @route   GET /dashboard/students
 * @desc    Listar todos los estudiantes con estadísticas resumidas
 * @access  Private (solo profesores)
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/students",
  verifyToken,
  requireTeacher,
  DashboardController.getStudents
);

/**
 * @route   GET /dashboard/students/:id
 * @desc    Ver estadísticas detalladas de un estudiante específico
 * @access  Private (solo profesores)
 * @headers Authorization: Bearer <token>
 * @params  id - ID del estudiante
 */
router.get(
  "/students/:id",
  verifyToken,
  requireTeacher,
  validateId,
  DashboardController.getStudentDetails
);

/**
 * @route   GET /dashboard/ranking
 * @desc    Ranking de estudiantes por puntaje promedio
 * @access  Private (solo profesores)
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/ranking",
  verifyToken,
  requireTeacher,
  DashboardController.getRanking
);

/**
 * @route   GET /dashboard/stats
 * @desc    Estadísticas generales del sistema
 * @access  Private (solo profesores)
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/stats",
  verifyToken,
  requireTeacher,
  DashboardController.getSystemStats
);

/**
 * @route   GET /dashboard/analysis
 * @desc    Análisis de rendimiento por temas/dificultad
 * @access  Private (solo profesores)
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/analysis",
  verifyToken,
  requireTeacher,
  DashboardController.getPerformanceAnalysis
);

/**
 * @route   GET /dashboard/export
 * @desc    Exportar datos de todos los estudiantes
 * @access  Private (solo profesores)
 * @headers Authorization: Bearer <token>
 */
router.get(
  "/export",
  verifyToken,
  requireTeacher,
  DashboardController.exportStudentData
);

/**
 * @route   GET /dashboard/export/:id
 * @desc    Exportar datos de un estudiante específico
 * @access  Private (solo profesores)
 * @headers Authorization: Bearer <token>
 * @params  id - ID del estudiante
 */
router.get(
  "/export/:id",
  verifyToken,
  requireTeacher,
  validateId,
  DashboardController.exportStudentData
);

module.exports = router;
