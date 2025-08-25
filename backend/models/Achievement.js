const database = require("../config/database");

class Achievement {
  // Obtener todos los logros
  static async getAllAchievements() {
    return await database.all(`
      SELECT 
        a.*,
        u.name as created_by_name
      FROM achievements a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `);
  }

  // Obtener logros activos
  static async getActiveAchievements() {
    return await database.all(`
      SELECT * FROM achievements 
      WHERE is_active = 1
      ORDER BY criteria_value ASC
    `);
  }

  // Obtener logro por ID
  static async getAchievementById(id) {
    return await database.get(
      `
      SELECT * FROM achievements 
      WHERE id = ?
    `,
      [id]
    );
  }

  // Crear nuevo logro
  static async createAchievement(achievementData) {
    const {
      name,
      description,
      icon,
      criteria_type,
      criteria_value,
      points_reward,
      badge_color,
      created_by,
    } = achievementData;

    const result = await database.run(
      `
      INSERT INTO achievements 
      (name, description, icon, criteria_type, criteria_value, points_reward, badge_color, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        description,
        icon,
        criteria_type,
        criteria_value,
        points_reward,
        badge_color,
        created_by,
      ]
    );

    return result;
  }

  // Actualizar logro
  static async updateAchievement(id, achievementData) {
    const {
      name,
      description,
      icon,
      criteria_type,
      criteria_value,
      points_reward,
      badge_color,
      is_active,
    } = achievementData;

    await database.run(
      `
      UPDATE achievements 
      SET name = ?, 
          description = ?, 
          icon = ?, 
          criteria_type = ?, 
          criteria_value = ?, 
          points_reward = ?, 
          badge_color = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        name,
        description,
        icon,
        criteria_type,
        criteria_value,
        points_reward,
        badge_color,
        is_active,
        id,
      ]
    );
  }

  // Eliminar logro
  static async deleteAchievement(id) {
    await database.run(
      `
      DELETE FROM achievements 
      WHERE id = ?
    `,
      [id]
    );
  }

  // Obtener logros de un usuario
  static async getUserAchievements(userId) {
    return await database.all(
      `
      SELECT 
        a.*,
        ua.earned_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC
    `,
      [userId]
    );
  }

  // Verificar si un usuario tiene un logro específico
  static async hasAchievement(userId, achievementId) {
    const result = await database.get(
      `
      SELECT id FROM user_achievements 
      WHERE user_id = ? AND achievement_id = ?
    `,
      [userId, achievementId]
    );

    return !!result;
  }

  // Otorgar logro a un usuario
  static async grantAchievement(userId, achievementId) {
    try {
      await database.run(
        `
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (?, ?)
      `,
        [userId, achievementId]
      );

      return true;
    } catch (error) {
      // Si ya tiene el logro, no hacer nada
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return false;
      }
      throw error;
    }
  }

  // Verificar y otorgar logros automáticamente
  static async checkAndGrantAchievements(userId) {
    const achievements = await this.getActiveAchievements();
    const grantedAchievements = [];

    for (const achievement of achievements) {
      // Verificar si ya tiene el logro
      if (await this.hasAchievement(userId, achievement.id)) {
        continue;
      }

      // Verificar si cumple los criterios
      const meetsCriteria = await this.checkAchievementCriteria(
        userId,
        achievement
      );

      if (meetsCriteria) {
        await this.grantAchievement(userId, achievement.id);
        grantedAchievements.push(achievement);
      }
    }

    return grantedAchievements;
  }

  // Verificar criterios de un logro específico
  static async checkAchievementCriteria(userId, achievement) {
    const { criteria_type, criteria_value } = achievement;

    switch (criteria_type) {
      case "games_played":
        return await this.checkGamesPlayed(userId, criteria_value);

      case "score_reached":
        return await this.checkScoreReached(userId, criteria_value);

      case "streak_days":
        return await this.checkStreakDays(userId, criteria_value);

      case "accuracy_percentage":
        return await this.checkAccuracyPercentage(userId, criteria_value);

      case "total_points":
        return await this.checkTotalPoints(userId, criteria_value);

      case "level_reached":
        return await this.checkLevelReached(userId, criteria_value);

      default:
        return false;
    }
  }

  // Verificar partidas jugadas
  static async checkGamesPlayed(userId, requiredGames) {
    const result = await database.get(
      `
      SELECT COUNT(*) as games_count
      FROM games 
      WHERE user_id = ?
    `,
      [userId]
    );

    return result.games_count >= requiredGames;
  }

  // Verificar puntuación alcanzada
  static async checkScoreReached(userId, requiredScore) {
    const result = await database.get(
      `
      SELECT MAX(score) as max_score
      FROM games 
      WHERE user_id = ?
    `,
      [userId]
    );

    return result.max_score >= requiredScore;
  }

  // Verificar racha de días
  static async checkStreakDays(userId, requiredStreak) {
    // Implementación simplificada - contar días consecutivos con partidas
    const result = await database.get(
      `
      SELECT COUNT(DISTINCT DATE(played_at)) as streak_days
      FROM games 
      WHERE user_id = ? 
      AND played_at >= DATE('now', '-7 days')
    `,
      [userId]
    );

    return result.streak_days >= requiredStreak;
  }

  // Verificar porcentaje de precisión
  static async checkAccuracyPercentage(userId, requiredAccuracy) {
    const result = await database.get(
      `
      SELECT 
        CASE 
          WHEN SUM(total_questions) > 0 
          THEN ROUND((SUM(correct_answers) * 100.0) / SUM(total_questions), 2)
          ELSE 0 
        END as avg_accuracy
      FROM games 
      WHERE user_id = ?
    `,
      [userId]
    );

    return result.avg_accuracy >= requiredAccuracy;
  }

  // Verificar puntos totales
  static async checkTotalPoints(userId, requiredPoints) {
    const result = await database.get(
      `
      SELECT SUM(score) as total_points
      FROM games 
      WHERE user_id = ?
    `,
      [userId]
    );

    return (result.total_points || 0) >= requiredPoints;
  }

  // Verificar nivel alcanzado
  static async checkLevelReached(userId, requiredLevel) {
    const Level = require("./Level");
    const userLevel = await Level.getUserLevel(userId);

    return userLevel.current_level >= requiredLevel;
  }

  // Obtener estadísticas de logros
  static async getAchievementStats() {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_achievements,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_achievements,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_achievements
      FROM achievements
    `);

    const totalGranted = await database.get(`
      SELECT COUNT(*) as total_granted
      FROM user_achievements
    `);

    return {
      ...stats,
      totalGranted: totalGranted.total_granted,
    };
  }

  // Obtener logros más populares
  static async getPopularAchievements(limit = 5) {
    return await database.all(
      `
      SELECT 
        a.*,
        COUNT(ua.id) as times_earned
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE a.is_active = 1
      GROUP BY a.id
      ORDER BY times_earned DESC
      LIMIT ?
    `,
      [limit]
    );
  }
}

module.exports = Achievement;
