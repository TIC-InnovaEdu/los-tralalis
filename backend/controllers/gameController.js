const Game = require("../models/Game");
const User = require("../models/User");

class GameController {
  // Crear una nueva partida
  static async createGame(req, res) {
    try {
      const gameData = req.body;

      // Verificar que el usuario existe y es estudiante
      const user = await User.findById(gameData.user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      if (user.role !== "student") {
        return res.status(400).json({
          success: false,
          message: "Solo los estudiantes pueden crear partidas",
        });
      }

      // Verificar que el usuario solo pueda crear partidas para sí mismo
      // (a menos que sea profesor)
      if (req.user.role !== "teacher" && req.user.id !== gameData.user_id) {
        return res.status(403).json({
          success: false,
          message: "Solo puedes crear partidas para tu propio usuario",
        });
      }

      // Crear la partida
      const game = await Game.create(gameData);

      res.status(201).json({
        success: true,
        message: "Partida guardada exitosamente",
        data: {
          game: {
            id: game.id,
            user_id: game.user_id,
            player_name: game.player_name,
            score: game.score,
            correct_answers: game.correct_answers,
            wrong_answers: game.wrong_answers,
            total_questions: game.total_questions,
            duration: game.duration,
            played_at: game.played_at,
            accuracy_percentage:
              game.total_questions > 0
                ? Math.round(
                    (game.correct_answers / game.total_questions) * 100
                  )
                : 0,
          },
        },
      });
    } catch (error) {
      console.error("Error creando partida:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener historial de partidas de un usuario
  static async getUserGames(req, res) {
    try {
      const userId = parseInt(req.params.user_id);
      const limit = parseInt(req.query.limit) || 50;

      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Obtener las partidas
      const games = await Game.findByUserId(userId, limit);

      // Calcular estadísticas resumidas
      const stats = await Game.getUserStats(userId);

      res.json({
        success: true,
        message: "Historial de partidas obtenido exitosamente",
        data: {
          user_info: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          stats: {
            total_games: stats.total_games,
            avg_score: Math.round(stats.avg_score * 100) / 100,
            best_score: stats.best_score,
            total_correct: stats.total_correct,
            total_wrong: stats.total_wrong,
            accuracy_percentage: stats.accuracy_percentage,
            avg_duration: Math.round(stats.avg_duration),
          },
          games: games.map((game) => ({
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
      console.error("Error obteniendo historial:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener detalles de una partida específica
  static async getGameDetails(req, res) {
    try {
      const userId = parseInt(req.params.user_id);
      const gameId = parseInt(req.params.game_id);

      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Verificar que la partida pertenece al usuario
      const belongsToUser = await Game.belongsToUser(gameId, userId);
      if (!belongsToUser) {
        return res.status(404).json({
          success: false,
          message: "Partida no encontrada para este usuario",
        });
      }

      // Obtener los detalles de la partida
      const game = await Game.findById(gameId);

      if (!game) {
        return res.status(404).json({
          success: false,
          message: "Partida no encontrada",
        });
      }

      res.json({
        success: true,
        message: "Detalles de partida obtenidos exitosamente",
        data: {
          game: {
            id: game.id,
            user_id: game.user_id,
            player_name: game.player_name,
            player_email: game.player_email,
            score: game.score,
            correct_answers: game.correct_answers,
            wrong_answers: game.wrong_answers,
            total_questions: game.total_questions,
            duration: game.duration,
            played_at: game.played_at,
            accuracy_percentage:
              game.total_questions > 0
                ? Math.round(
                    (game.correct_answers / game.total_questions) * 100
                  )
                : 0,
            questions: game.questions,
          },
        },
      });
    } catch (error) {
      console.error("Error obteniendo detalles de partida:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener mis partidas (usuario autenticado)
  static async getMyGames(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;

      // Verificar que es estudiante
      if (req.user.role !== "student") {
        return res.status(400).json({
          success: false,
          message: "Solo los estudiantes tienen historial de partidas",
        });
      }

      // Obtener las partidas
      const games = await Game.findByUserId(userId, limit);

      // Calcular estadísticas resumidas
      const stats = await Game.getUserStats(userId);

      res.json({
        success: true,
        message: "Mi historial de partidas obtenido exitosamente",
        data: {
          stats: {
            total_games: stats.total_games,
            avg_score: Math.round(stats.avg_score * 100) / 100,
            best_score: stats.best_score,
            total_correct: stats.total_correct,
            total_wrong: stats.total_wrong,
            accuracy_percentage: stats.accuracy_percentage,
            avg_duration: Math.round(stats.avg_duration),
          },
          games: games.map((game) => ({
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
      console.error("Error obteniendo mis partidas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener una partida específica (para el usuario autenticado)
  static async getMyGameDetails(req, res) {
    try {
      const gameId = parseInt(req.params.game_id);
      const userId = req.user.id;

      // Verificar que la partida pertenece al usuario
      const belongsToUser = await Game.belongsToUser(gameId, userId);
      if (!belongsToUser) {
        return res.status(404).json({
          success: false,
          message: "Partida no encontrada",
        });
      }

      // Obtener los detalles de la partida
      const game = await Game.findById(gameId);

      if (!game) {
        return res.status(404).json({
          success: false,
          message: "Partida no encontrada",
        });
      }

      res.json({
        success: true,
        message: "Detalles de partida obtenidos exitosamente",
        data: {
          game: {
            id: game.id,
            score: game.score,
            correct_answers: game.correct_answers,
            wrong_answers: game.wrong_answers,
            total_questions: game.total_questions,
            duration: game.duration,
            played_at: game.played_at,
            accuracy_percentage:
              game.total_questions > 0
                ? Math.round(
                    (game.correct_answers / game.total_questions) * 100
                  )
                : 0,
            questions: game.questions,
          },
        },
      });
    } catch (error) {
      console.error("Error obteniendo detalles de mi partida:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = GameController;
