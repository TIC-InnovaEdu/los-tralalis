const database = require('../config/database');

class Reward {
  // Obtener todos los premios
  static async getAllRewards() {
    return await database.all(`
      SELECT 
        r.*,
        u.name as created_by_name
      FROM rewards r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.points_required ASC
    `);
  }

  // Obtener premios activos
  static async getActiveRewards() {
    return await database.all(`
      SELECT * FROM rewards 
      WHERE is_active = 1
      ORDER BY points_required ASC
    `);
  }

  // Obtener premio por ID
  static async getRewardById(id) {
    return await database.get(`
      SELECT * FROM rewards 
      WHERE id = ?
    `, [id]);
  }

  // Crear nuevo premio
  static async createReward(rewardData) {
    const { name, description, reward_type, reward_value, points_required, is_active, created_by } = rewardData;
    
    const result = await database.run(`
      INSERT INTO rewards 
      (name, description, reward_type, reward_value, points_required, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description, reward_type, reward_value, points_required, is_active ? 1 : 0, created_by]);

    return result;
  }

  // Actualizar premio existente
  static async updateReward(id, rewardData) {
    const { name, description, reward_type, reward_value, points_required, is_active } = rewardData;
    
    await database.run(`
      UPDATE rewards 
      SET name = ?, 
          description = ?, 
          reward_type = ?, 
          reward_value = ?, 
          points_required = ?, 
          is_active = ?
      WHERE id = ?
    `, [name, description, reward_type, reward_value, points_required, is_active ? 1 : 0, id]);
  }

  // Eliminar premio
  static async deleteReward(id) {
    await database.run(`
      DELETE FROM rewards 
      WHERE id = ?
    `, [id]);
  }

  // Obtener premios de un usuario
  static async getUserRewards(userId) {
    return await database.all(`
      SELECT 
        r.*,
        ur.earned_at
      FROM user_rewards ur
      JOIN rewards r ON ur.reward_id = r.id
      WHERE ur.user_id = ?
      ORDER BY ur.earned_at DESC
    `, [userId]);
  }

  // Verificar si un usuario tiene un premio específico
  static async hasReward(userId, rewardId) {
    const result = await database.get(`
      SELECT id FROM user_rewards 
      WHERE user_id = ? AND reward_id = ?
    `, [userId, rewardId]);

    return !!result;
  }

  // Otorgar premio a un usuario
  static async grantReward(userId, rewardId) {
    try {
      await database.run(`
        INSERT INTO user_rewards (user_id, reward_id)
        VALUES (?, ?)
      `, [userId, rewardId]);

      return true;
    } catch (error) {
      // Si ya tiene el premio, no hacer nada
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return false;
      }
      throw error;
    }
  }

  // Canjear premio (verificar puntos y otorgar)
  static async redeemReward(userId, rewardId) {
    // Verificar si ya tiene el premio
    if (await this.hasReward(userId, rewardId)) {
      throw new Error('El usuario ya tiene este premio');
    }

    // Obtener información del premio
    const reward = await this.getRewardById(rewardId);
    if (!reward) {
      throw new Error('Premio no encontrado');
    }

    if (!reward.is_active) {
      throw new Error('Este premio no está disponible');
    }

    // Verificar puntos del usuario
    const Level = require('./Level');
    const userLevel = await Level.getUserLevel(userId);
    
    if (userLevel.total_experience < reward.points_required) {
      throw new Error('Puntos insuficientes para canjear este premio');
    }

    // Otorgar el premio
    await this.grantReward(userId, rewardId);
    
    return reward;
  }

  // Obtener estadísticas de premios
  static async getRewardStats() {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_rewards,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_rewards,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_rewards
      FROM rewards
    `);

    const totalRedeemed = await database.get(`
      SELECT COUNT(*) as total_redeemed
      FROM user_rewards
    `);

    const popularRewards = await database.all(`
      SELECT 
        r.name,
        r.reward_type,
        COUNT(ur.id) as redemption_count
      FROM rewards r
      LEFT JOIN user_rewards ur ON r.id = ur.reward_id
      WHERE r.is_active = 1
      GROUP BY r.id, r.name, r.reward_type
      ORDER BY redemption_count DESC
      LIMIT 5
    `);

    return {
      ...stats,
      totalRedeemed: totalRedeemed.total_redeemed,
      popularRewards
    };
  }

  // Obtener premios disponibles para un usuario (que puede canjear)
  static async getAvailableRewards(userId) {
    const Level = require('./Level');
    const userLevel = await Level.getUserLevel(userId);
    
    return await database.all(`
      SELECT r.*
      FROM rewards r
      WHERE r.is_active = 1
      AND r.points_required <= ?
      AND NOT EXISTS (
        SELECT 1 FROM user_rewards ur 
        WHERE ur.user_id = ? AND ur.reward_id = r.id
      )
      ORDER BY r.points_required ASC
    `, [userLevel.total_experience, userId]);
  }
}

module.exports = Reward;