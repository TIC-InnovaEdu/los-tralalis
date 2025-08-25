const User = require("../models/User");
const Game = require("../models/Game");

class DashboardController {
  // Listar todos los estudiantes con estadísticas resumidas
  static async getStudents(req, res) {
    try {
      const students = await User.getStudentsWithStats();

      res.json({
        success: true,
        message: "Lista de estudiantes obtenida exitosamente",
        data: {
          total_students: students.length,
          students: students.map((student) => ({
            id: student.id,
            name: student.name,
            email: student.email,
            created_at: student.created_at,
            stats: {
              total_games: student.total_games,
              avg_score: Math.round(student.avg_score * 100) / 100,
              best_score: student.best_score,
              total_correct: student.total_correct,
              total_wrong: student.total_wrong,
              total_questions: student.total_questions,
              total_time_played: student.total_time_played,
              accuracy_percentage: student.accuracy_percentage,
            },
          })),
        },
      });
    } catch (error) {
      console.error("Error obteniendo estudiantes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Ver estadísticas detalladas de un estudiante específico
  static async getStudentDetails(req, res) {
    try {
      const studentId = parseInt(req.params.id);

      // Verificar que el usuario existe y es estudiante
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Estudiante no encontrado",
        });
      }

      if (student.role !== "student") {
        return res.status(400).json({
          success: false,
          message: "El usuario especificado no es un estudiante",
        });
      }

      // Obtener estadísticas detalladas
      const stats = await Game.getUserStats(studentId);

      // Obtener historial reciente (últimas 20 partidas)
      const recentGames = await Game.findByUserId(studentId, 20);

      res.json({
        success: true,
        message: "Estadísticas del estudiante obtenidas exitosamente",
        data: {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            created_at: student.created_at,
          },
          stats: {
            total_games: stats.total_games,
            avg_score: Math.round(stats.avg_score * 100) / 100,
            best_score: stats.best_score,
            worst_score: stats.worst_score,
            total_correct: stats.total_correct,
            total_wrong: stats.total_wrong,
            total_questions: stats.total_questions,
            accuracy_percentage: stats.accuracy_percentage,
            avg_duration: Math.round(stats.avg_duration),
          },
          evolution: stats.evolution.map((game) => ({
            score: game.score,
            accuracy: game.accuracy,
            played_at: game.played_at,
          })),
          recent_games: recentGames.map((game) => ({
            id: game.id,
            score: game.score,
            correct_answers: game.correct_answers,
            wrong_answers: game.wrong_answers,
            total_questions: game.total_questions,
            duration: game.duration,
            played_at: game.played_at,
            accuracy:
              game.total_questions > 0
                ? Math.round(
                    (game.correct_answers / game.total_questions) * 100
                  )
                : 0,
          })),
        },
      });
    } catch (error) {
      console.error("Error obteniendo detalles del estudiante:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener ranking de estudiantes por puntaje promedio
  static async getRanking(req, res) {
    try {
      const ranking = await User.getStudentsRanking();

      res.json({
        success: true,
        message: "Ranking de estudiantes obtenido exitosamente",
        data: {
          total_ranked_students: ranking.length,
          ranking: ranking.map((student, index) => ({
            position: index + 1,
            id: student.id,
            name: student.name,
            email: student.email,
            stats: {
              total_games: student.total_games,
              avg_score: Math.round(student.avg_score * 100) / 100,
              best_score: student.best_score,
              accuracy_percentage: student.accuracy_percentage,
            },
          })),
        },
      });
    } catch (error) {
      console.error("Error obteniendo ranking:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener estadísticas generales del sistema
  static async getSystemStats(req, res) {
    try {
      const systemStats = await Game.getSystemStats();
      const recentGames = await Game.getRecentGames(10);
      const weeklyProgress = await Game.getWeeklyProgress();
      const scoreDistribution = await Game.getScoreDistribution();

      res.json({
        success: true,
        message: "Estadísticas del sistema obtenidas exitosamente",
        data: {
          system_stats: {
            active_students: systemStats.active_students,
            total_games: systemStats.total_games,
            avg_score: Math.round(systemStats.avg_score * 100) / 100,
            total_questions_answered: systemStats.total_questions_answered,
            total_correct_answers: systemStats.total_correct_answers,
            system_accuracy: systemStats.system_accuracy,
          },
          weekly_progress: weeklyProgress,
          score_distribution: scoreDistribution,
          recent_activity: recentGames.map((game) => ({
            id: game.id,
            player_name: game.player_name,
            player_email: game.player_email,
            score: game.score,
            accuracy:
              game.total_questions > 0
                ? Math.round(
                    (game.correct_answers / game.total_questions) * 100
                  )
                : 0,
            played_at: game.played_at,
          })),
        },
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas del sistema:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener análisis de rendimiento por temas/dificultad
  static async getPerformanceAnalysis(req, res) {
    try {
      const { period = 'week', metric = 'score' } = req.query;
      
      // Obtener datos según el período
      let daysBack;
      switch (period) {
        case 'week':
          daysBack = 7;
          break;
        case 'month':
          daysBack = 30;
          break;
        case 'quarter':
          daysBack = 90;
          break;
        case 'all':
          daysBack = 365; // Un año para "todo el tiempo"
          break;
        default:
          daysBack = 7;
      }

      // Análisis temporal - tendencias por día
      const temporalTrend = await Game.getTemporalTrend(daysBack, metric);
      
      // Análisis de dificultad - distribución de puntajes
      const difficultyAnalysis = await Game.getDifficultyAnalysis(daysBack);
      
      // Estadísticas de rendimiento detalladas
      const performanceStats = await Game.getDetailedPerformanceStats(daysBack);
      
      // Análisis de tiempo
      const timeAnalysis = await Game.getTimeAnalysis(daysBack);

      res.json({
        success: true,
        message: "Análisis de rendimiento obtenido exitosamente",
        data: {
          period,
          metric,
          temporal_trend: temporalTrend,
          difficulty_analysis: difficultyAnalysis,
          performance_stats: performanceStats,
          time_analysis: timeAnalysis
        },
      });
    } catch (error) {
      console.error("Error en análisis de rendimiento:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Exportar datos de estudiantes (para reportes)
  static async exportStudentData(req, res) {
    try {
      const studentId = req.params.id ? parseInt(req.params.id) : null;

      if (studentId) {
        // Exportar datos de un estudiante específico
        const student = await User.findById(studentId);
        if (!student || student.role !== "student") {
          return res.status(404).json({
            success: false,
            message: "Estudiante no encontrado",
          });
        }

        const games = await Game.findByUserId(studentId, 1000); // Todas las partidas
        const stats = await Game.getUserStats(studentId);

        res.json({
          success: true,
          message: "Datos del estudiante exportados exitosamente",
          data: {
            student_info: student,
            summary_stats: stats,
            all_games: games,
            export_date: new Date().toISOString(),
          },
        });
      } else {
        // Exportar datos de todos los estudiantes
        const students = await User.getStudentsWithStats();

        res.json({
          success: true,
          message: "Datos de todos los estudiantes exportados exitosamente",
          data: {
            students: students,
            total_count: students.length,
            export_date: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error exportando datos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = DashboardController;
