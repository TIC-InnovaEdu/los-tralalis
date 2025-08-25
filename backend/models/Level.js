const database = require("../config/database");

class Level {
  // Obtener configuración de todos los niveles
  static async getAllLevels() {
    return await database.all(`
      SELECT * FROM level_config 
      ORDER BY level_number ASC
    `);
  }

  // Obtener configuración de un nivel específico
  static async getLevelConfig(levelNumber) {
    return await database.get(`
      SELECT * FROM level_config 
      WHERE level_number = ?
    `, [levelNumber]);
  }

  // Obtener nivel actual de un usuario
  static async getUserLevel(userId) {
    let userLevel = await database.get(`
      SELECT * FROM user_levels 
      WHERE user_id = ?
    `, [userId]);

    // Si no existe, crear el nivel inicial
    if (!userLevel) {
      await this.initializeUserLevel(userId);
      userLevel = await database.get(`
        SELECT * FROM user_levels 
        WHERE user_id = ?
      `, [userId]);
    }

    return userLevel;
  }

  // Inicializar nivel de usuario
  static async initializeUserLevel(userId) {
    await database.run(`
      INSERT INTO user_levels (user_id, current_level, current_experience, total_experience)
      VALUES (?, 1, 0, 0)
    `, [userId]);
  }

  // Agregar experiencia a un usuario
  static async addExperience(userId, experiencePoints) {
    const userLevel = await this.getUserLevel(userId);
    
    const newTotalExp = userLevel.total_experience + experiencePoints;
    const newCurrentExp = userLevel.current_experience + experiencePoints;
    
    // Verificar si subió de nivel
    const nextLevel = await this.getNextLevel(userLevel.current_level);
    let levelUp = false;
    let newLevel = userLevel.current_level;
    
    if (nextLevel && newCurrentExp >= nextLevel.experience_required) {
      newLevel = nextLevel.level_number;
      levelUp = true;
    }

    // Actualizar nivel del usuario
    await database.run(`
      UPDATE user_levels 
      SET current_level = ?, 
          current_experience = ?, 
          total_experience = ?,
          last_level_up = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [
      newLevel,
      newCurrentExp,
      newTotalExp,
      levelUp ? new Date().toISOString() : userLevel.last_level_up,
      userId
    ]);

    return {
      levelUp,
      newLevel,
      newExperience: newCurrentExp,
      totalExperience: newTotalExp,
      nextLevel: nextLevel
    };
  }

  // Obtener el siguiente nivel
  static async getNextLevel(currentLevel) {
    return await database.get(`
      SELECT * FROM level_config 
      WHERE level_number = ?
    `, [currentLevel + 1]);
  }

  // Obtener progreso hacia el siguiente nivel
  static async getLevelProgress(userId) {
    const userLevel = await this.getUserLevel(userId);
    const currentLevelConfig = await this.getLevelConfig(userLevel.current_level);
    const nextLevelConfig = await this.getNextLevel(userLevel.current_level);

    if (!nextLevelConfig) {
      return {
        currentLevel: userLevel.current_level,
        currentExp: userLevel.current_experience,
        totalExp: userLevel.total_experience,
        isMaxLevel: true,
        progressPercentage: 100
      };
    }

    const expForCurrentLevel = currentLevelConfig.experience_required;
    const expForNextLevel = nextLevelConfig.experience_required;
    const expNeeded = expForNextLevel - expForCurrentLevel;
    const expProgress = userLevel.current_experience - expForCurrentLevel;
    const progressPercentage = Math.min((expProgress / expNeeded) * 100, 100);

    return {
      currentLevel: userLevel.current_level,
      currentExp: userLevel.current_experience,
      totalExp: userLevel.total_experience,
      expForNextLevel: expForNextLevel,
      expNeeded: expNeeded,
      expProgress: expProgress,
      progressPercentage: Math.round(progressPercentage),
      isMaxLevel: false,
      nextLevel: nextLevelConfig
    };
  }

  // Obtener estadísticas de niveles de todos los usuarios
  static async getAllUsersLevels() {
    return await database.all(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ul.current_level,
        ul.current_experience,
        ul.total_experience,
        ul.last_level_up,
        lc.title as level_title,
        lc.badge_icon,
        lc.badge_color
      FROM users u
      LEFT JOIN user_levels ul ON u.id = ul.user_id
      LEFT JOIN level_config lc ON ul.current_level = lc.level_number
      WHERE u.role = 'student'
      ORDER BY ul.total_experience DESC, ul.current_level DESC
    `);
  }

  // Crear nuevo nivel (para el profesor)
  static async createLevel(levelData) {
    const { level_number, experience_required, title, description, badge_icon, badge_color, rewards_points } = levelData;
    
    const result = await database.run(`
      INSERT INTO level_config 
      (level_number, experience_required, title, description, badge_icon, badge_color, rewards_points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [level_number, experience_required, title, description, badge_icon, badge_color, rewards_points]);

    return result;
  }

  // Actualizar nivel existente
  static async updateLevel(levelNumber, levelData) {
    const { experience_required, title, description, badge_icon, badge_color, rewards_points } = levelData;
    
    await database.run(`
      UPDATE level_config 
      SET experience_required = ?, 
          title = ?, 
          description = ?, 
          badge_icon = ?, 
          badge_color = ?, 
          rewards_points = ?
      WHERE level_number = ?
    `, [experience_required, title, description, badge_icon, badge_color, rewards_points, levelNumber]);
  }

  // Eliminar nivel
  static async deleteLevel(levelNumber) {
    await database.run(`
      DELETE FROM level_config 
      WHERE level_number = ?
    `, [levelNumber]);
  }
}

module.exports = Level; 