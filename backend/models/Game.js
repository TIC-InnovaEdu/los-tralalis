const database = require("../config/database");

class Game {
  // Crear una nueva partida con sus detalles
  static async create(gameData) {
    const {
      user_id,
      score,
      correct_answers,
      wrong_answers,
      total_questions,
      duration,
      questions,
    } = gameData;

    // Iniciar transacción
    await database.run("BEGIN TRANSACTION");

    try {
      // Insertar la partida principal
      const gameResult = await database.run(
        `
                INSERT INTO games (user_id, score, correct_answers, wrong_answers, total_questions, duration, played_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `,
        [
          user_id,
          score,
          correct_answers,
          wrong_answers,
          total_questions,
          duration,
        ]
      );

      const gameId = gameResult.id;

      // Insertar los detalles de cada pregunta
      if (questions && questions.length > 0) {
        for (const question of questions) {
          await database.run(
            `
                        INSERT INTO game_details (game_id, question, user_answer, correct_answer, is_correct)
                        VALUES (?, ?, ?, ?, ?)
                    `,
            [
              gameId,
              question.question,
              question.user_answer,
              question.correct_answer,
              question.is_correct ? 1 : 0,
            ]
          );
        }
      }

      // Confirmar transacción
      await database.run("COMMIT");

      return await this.findById(gameId);
    } catch (error) {
      // Revertir transacción en caso de error
      await database.run("ROLLBACK");
      throw error;
    }
  }

  // Buscar partida por ID con detalles
  static async findById(id) {
    const game = await database.get(
      `
            SELECT 
                g.*,
                u.name as player_name,
                u.email as player_email
            FROM games g
            JOIN users u ON g.user_id = u.id
            WHERE g.id = ?
        `,
      [id]
    );

    if (!game) return null;

    // Obtener detalles de las preguntas
    const details = await database.all(
      `
            SELECT * FROM game_details 
            WHERE game_id = ? 
            ORDER BY id
        `,
      [id]
    );

    return {
      ...game,
      questions: details.map((detail) => ({
        id: detail.id,
        question: detail.question,
        user_answer: detail.user_answer,
        correct_answer: detail.correct_answer,
        is_correct: Boolean(detail.is_correct),
      })),
    };
  }

  // Obtener historial de partidas de un usuario
  static async findByUserId(userId, limit = 50) {
    const games = await database.all(
      `
            SELECT 
                g.*,
                u.name as player_name
            FROM games g
            JOIN users u ON g.user_id = u.id
            WHERE g.user_id = ?
            ORDER BY g.played_at DESC
            LIMIT ?
        `,
      [userId, limit]
    );

    return games;
  }

  // Obtener estadísticas detalladas de un usuario
  static async getUserStats(userId) {
    const stats = await database.get(
      `
            SELECT 
                COUNT(*) as total_games,
                COALESCE(AVG(score), 0) as avg_score,
                COALESCE(MAX(score), 0) as best_score,
                COALESCE(MIN(score), 0) as worst_score,
                COALESCE(SUM(correct_answers), 0) as total_correct,
                COALESCE(SUM(wrong_answers), 0) as total_wrong,
                COALESCE(SUM(total_questions), 0) as total_questions,
                COALESCE(AVG(duration), 0) as avg_duration,
                CASE 
                    WHEN SUM(total_questions) > 0 
                    THEN ROUND((SUM(correct_answers) * 100.0) / SUM(total_questions), 2)
                    ELSE 0 
                END as accuracy_percentage
            FROM games 
            WHERE user_id = ?
        `,
      [userId]
    );

    // Obtener evolución en el tiempo (últimas 10 partidas)
    const evolution = await database.all(
      `
            SELECT 
                score,
                correct_answers,
                wrong_answers,
                total_questions,
                played_at,
                ROUND((correct_answers * 100.0) / total_questions, 2) as accuracy
            FROM games 
            WHERE user_id = ?
            ORDER BY played_at DESC 
            LIMIT 10
        `,
      [userId]
    );

    return {
      ...stats,
      evolution: evolution.reverse(), // Mostrar del más antiguo al más reciente
    };
  }

  // Obtener partidas recientes del sistema (para dashboard)
  static async getRecentGames(limit = 20) {
    const games = await database.all(
      `
            SELECT 
                g.*,
                u.name as player_name,
                u.email as player_email
            FROM games g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student'
            ORDER BY g.played_at DESC
            LIMIT ?
        `,
      [limit]
    );

    return games;
  }

  // Verificar si una partida pertenece a un usuario
  static async belongsToUser(gameId, userId) {
    const game = await database.get(
      `
            SELECT id FROM games 
            WHERE id = ? AND user_id = ?
        `,
      [gameId, userId]
    );

    return !!game;
  }

  // Obtener estadísticas generales del sistema
  static async getSystemStats() {
    const stats = await database.get(`
            SELECT 
                COUNT(DISTINCT g.user_id) as active_students,
                COUNT(g.id) as total_games,
                COALESCE(AVG(g.score), 0) as avg_score,
                COALESCE(SUM(g.total_questions), 0) as total_questions_answered,
                COALESCE(SUM(g.correct_answers), 0) as total_correct_answers,
                CASE 
                    WHEN SUM(g.total_questions) > 0 
                    THEN ROUND((SUM(g.correct_answers) * 100.0) / SUM(g.total_questions), 2)
                    ELSE 0 
                END as system_accuracy
            FROM games g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student'
        `);

    return stats;
  }

  // Obtener progreso semanal (últimos 7 días)
  static async getWeeklyProgress() {
    const weeklyData = await database.all(`
            SELECT 
                DATE(played_at) as date,
                ROUND(AVG(score), 2) as avg_score,
                COUNT(*) as games_count,
                ROUND(AVG(CASE 
                    WHEN total_questions > 0 
                    THEN (correct_answers * 100.0) / total_questions 
                    ELSE 0 
                END), 2) as avg_accuracy
            FROM games g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student' 
                AND played_at >= DATE('now', '-7 days')
            GROUP BY DATE(played_at)
            ORDER BY date ASC
        `);

    return weeklyData;
  }

  // Obtener distribución de puntuaciones
  static async getScoreDistribution() {
    const distribution = await database.get(`
            SELECT 
                SUM(CASE WHEN score >= 90 THEN 1 ELSE 0 END) as excellent,
                SUM(CASE WHEN score >= 70 AND score < 90 THEN 1 ELSE 0 END) as good,
                SUM(CASE WHEN score >= 50 AND score < 70 THEN 1 ELSE 0 END) as regular,
                SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as needs_improvement,
                COUNT(*) as total_games
            FROM games g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student'
        `);

    return distribution;
  }

  // ===== MÉTODOS PARA ANALÍTICAS AVANZADAS =====

  // Obtener tendencia temporal por métrica
  static async getTemporalTrend(daysBack, metric) {
    let metricColumn;
    switch (metric) {
      case 'score':
        metricColumn = 'AVG(score)';
        break;
      case 'accuracy':
        metricColumn = 'AVG(CASE WHEN total_questions > 0 THEN (correct_answers * 100.0) / total_questions ELSE 0 END)';
        break;
      case 'time':
        metricColumn = 'AVG(CAST((julianday(ended_at) - julianday(played_at)) * 24 * 60 AS INTEGER))'; // minutos
        break;
      default:
        metricColumn = 'AVG(score)';
    }

    const trend = await database.all(`
      SELECT 
        DATE(played_at) as date,
        ROUND(${metricColumn}, 2) as value,
        COUNT(*) as games_count
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND played_at >= DATE('now', '-${daysBack} days')
      GROUP BY DATE(played_at)
      ORDER BY date ASC
    `);

    return trend;
  }

  // Obtener análisis de dificultad
  static async getDifficultyAnalysis(daysBack) {
    const analysis = await database.all(`
      SELECT 
        CASE 
          WHEN score >= 90 THEN 'Excelente (90-100)'
          WHEN score >= 80 THEN 'Muy Bueno (80-89)'
          WHEN score >= 70 THEN 'Bueno (70-79)'
          WHEN score >= 60 THEN 'Regular (60-69)'
          WHEN score >= 50 THEN 'Aceptable (50-59)'
          ELSE 'Necesita Mejora (0-49)'
        END as difficulty_level,
        COUNT(*) as count,
        ROUND(AVG(score), 2) as avg_score,
        ROUND(AVG(CASE WHEN total_questions > 0 THEN (correct_answers * 100.0) / total_questions ELSE 0 END), 2) as avg_accuracy
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND played_at >= DATE('now', '-${daysBack} days')
      GROUP BY 
        CASE 
          WHEN score >= 90 THEN 'Excelente (90-100)'
          WHEN score >= 80 THEN 'Muy Bueno (80-89)'
          WHEN score >= 70 THEN 'Bueno (70-79)'
          WHEN score >= 60 THEN 'Regular (60-69)'
          WHEN score >= 50 THEN 'Aceptable (50-59)'
          ELSE 'Necesita Mejora (0-49)'
        END
      ORDER BY avg_score DESC
    `);

    return analysis;
  }

  // Obtener estadísticas de rendimiento detalladas
  static async getDetailedPerformanceStats(daysBack) {
    const stats = await database.get(`
      SELECT 
        COUNT(DISTINCT g.user_id) as active_students,
        COUNT(g.id) as total_games,
        ROUND(AVG(g.score), 2) as avg_score,
        ROUND(MIN(g.score), 2) as min_score,
        ROUND(MAX(g.score), 2) as max_score,
        ROUND(AVG(CASE WHEN g.total_questions > 0 THEN (g.correct_answers * 100.0) / g.total_questions ELSE 0 END), 2) as avg_accuracy,
        ROUND(SUM(g.correct_answers), 0) as total_correct,
        ROUND(SUM(g.total_questions), 0) as total_questions,
        ROUND(SUM(g.correct_answers) * 100.0 / SUM(g.total_questions), 2) as overall_accuracy
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND g.played_at >= DATE('now', '-${daysBack} days')
    `);

    // Calcular desviación estándar manualmente ya que SQLite no tiene STDEV
    const scoresForStdDev = await database.all(`
      SELECT g.score
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND g.played_at >= DATE('now', '-${daysBack} days')
    `);

    let score_std_dev = 0;
    if (scoresForStdDev.length > 1 && stats.avg_score) {
      const variance = scoresForStdDev.reduce((sum, game) => {
        return sum + Math.pow(game.score - stats.avg_score, 2);
      }, 0) / scoresForStdDev.length;
      score_std_dev = Math.round(Math.sqrt(variance) * 100) / 100;
    }

    stats.score_std_dev = score_std_dev;

    // Calcular percentiles
    const percentiles = await database.all(`
      SELECT 
        score,
        NTILE(4) OVER (ORDER BY score) as quartile
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND g.played_at >= DATE('now', '-${daysBack} days')
      ORDER BY score
    `);

    const q25 = percentiles.find(p => p.quartile === 1)?.score || 0;
    const q50 = percentiles.find(p => p.quartile === 2)?.score || 0;
    const q75 = percentiles.find(p => p.quartile === 3)?.score || 0;

    return {
      ...stats,
      percentiles: {
        q25: Math.round(q25),
        q50: Math.round(q50),
        q75: Math.round(q75)
      }
    };
  }

  // Obtener análisis de tiempo
  static async getTimeAnalysis(daysBack) {
    const timeStats = await database.get(`
      SELECT 
        ROUND(AVG(CAST((julianday(ended_at) - julianday(played_at)) * 24 * 60 AS INTEGER)), 2) as avg_duration_minutes,
        ROUND(MIN(CAST((julianday(ended_at) - julianday(played_at)) * 24 * 60 AS INTEGER)), 2) as min_duration_minutes,
        ROUND(MAX(CAST((julianday(ended_at) - julianday(played_at)) * 24 * 60 AS INTEGER)), 2) as max_duration_minutes,
        COUNT(*) as total_games_with_time
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND g.played_at >= DATE('now', '-${daysBack} days')
        AND g.ended_at IS NOT NULL
    `);

    // Análisis por hora del día
    const hourlyAnalysis = await database.all(`
      SELECT 
        CAST(strftime('%H', played_at) AS INTEGER) as hour,
        COUNT(*) as games_count,
        ROUND(AVG(score), 2) as avg_score,
        ROUND(AVG(CAST((julianday(ended_at) - julianday(played_at)) * 24 * 60 AS INTEGER)), 2) as avg_duration
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND g.played_at >= DATE('now', '-${daysBack} days')
      GROUP BY CAST(strftime('%H', played_at) AS INTEGER)
      ORDER BY hour
    `);

    // Análisis por día de la semana
    const dailyAnalysis = await database.all(`
      SELECT 
        CASE CAST(strftime('%w', played_at) AS INTEGER)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as day_name,
        COUNT(*) as games_count,
        ROUND(AVG(score), 2) as avg_score,
        ROUND(AVG(CASE WHEN total_questions > 0 THEN (correct_answers * 100.0) / total_questions ELSE 0 END), 2) as avg_accuracy
      FROM games g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student' 
        AND g.played_at >= DATE('now', '-${daysBack} days')
      GROUP BY CAST(strftime('%w', played_at) AS INTEGER)
      ORDER BY CAST(strftime('%w', played_at) AS INTEGER)
    `);

    return {
      time_stats: timeStats,
      hourly_analysis: hourlyAnalysis,
      daily_analysis: dailyAnalysis
    };
  }
}

module.exports = Game;
