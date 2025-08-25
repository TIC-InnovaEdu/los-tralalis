const Level = require("../models/Level");
const Achievement = require("../models/Achievement");
const Reward = require("../models/Reward");

class LevelsController {
  // ===== GESTIÓN DE NIVELES =====

  // Obtener todos los niveles
  static async getAllLevels(req, res) {
    try {
      const levels = await Level.getAllLevels();

      res.json({
        success: true,
        message: "Niveles obtenidos exitosamente",
        data: { levels },
      });
    } catch (error) {
      console.error("Error obteniendo niveles:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Crear nuevo nivel
  static async createLevel(req, res) {
    try {
      const levelData = {
        ...req.body,
        created_by: req.user.id,
      };

      const result = await Level.createLevel(levelData);

      res.status(201).json({
        success: true,
        message: "Nivel creado exitosamente",
        data: { level_id: result.lastID },
      });
    } catch (error) {
      console.error("Error creando nivel:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Actualizar nivel
  static async updateLevel(req, res) {
    try {
      const { levelNumber } = req.params;
      const levelData = req.body;

      await Level.updateLevel(parseInt(levelNumber), levelData);

      res.json({
        success: true,
        message: "Nivel actualizado exitosamente",
      });
    } catch (error) {
      console.error("Error actualizando nivel:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Eliminar nivel
  static async deleteLevel(req, res) {
    try {
      const { levelNumber } = req.params;

      await Level.deleteLevel(parseInt(levelNumber));

      res.json({
        success: true,
        message: "Nivel eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando nivel:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener niveles de todos los usuarios
  static async getAllUsersLevels(req, res) {
    try {
      const usersLevels = await Level.getAllUsersLevels();

      res.json({
        success: true,
        message: "Niveles de usuarios obtenidos exitosamente",
        data: { users_levels: usersLevels },
      });
    } catch (error) {
      console.error("Error obteniendo niveles de usuarios:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // ===== GESTIÓN DE LOGROS =====

  // Obtener todos los logros
  static async getAllAchievements(req, res) {
    try {
      const achievements = await Achievement.getAllAchievements();

      res.json({
        success: true,
        message: "Logros obtenidos exitosamente",
        data: { achievements },
      });
    } catch (error) {
      console.error("Error obteniendo logros:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Crear nuevo logro
  static async createAchievement(req, res) {
    try {
      const achievementData = {
        ...req.body,
        created_by: req.user.id,
      };

      const result = await Achievement.createAchievement(achievementData);

      res.status(201).json({
        success: true,
        message: "Logro creado exitosamente",
        data: { achievement_id: result.lastID },
      });
    } catch (error) {
      console.error("Error creando logro:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Actualizar logro
  static async updateAchievement(req, res) {
    try {
      const { id } = req.params;
      const achievementData = req.body;

      await Achievement.updateAchievement(parseInt(id), achievementData);

      res.json({
        success: true,
        message: "Logro actualizado exitosamente",
      });
    } catch (error) {
      console.error("Error actualizando logro:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Eliminar logro
  static async deleteAchievement(req, res) {
    try {
      const { id } = req.params;

      await Achievement.deleteAchievement(parseInt(id));

      res.json({
        success: true,
        message: "Logro eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando logro:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener logros de un usuario específico
  static async getUserAchievements(req, res) {
    try {
      const { userId } = req.params;
      const achievements = await Achievement.getUserAchievements(
        parseInt(userId)
      );

      res.json({
        success: true,
        message: "Logros del usuario obtenidos exitosamente",
        data: { achievements },
      });
    } catch (error) {
      console.error("Error obteniendo logros del usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Otorgar logro manualmente a un usuario
  static async grantAchievement(req, res) {
    try {
      const { userId, achievementId } = req.body;

      const granted = await Achievement.grantAchievement(
        parseInt(userId),
        parseInt(achievementId)
      );

      if (granted) {
        res.json({
          success: true,
          message: "Logro otorgado exitosamente",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "El usuario ya tiene este logro",
        });
      }
    } catch (error) {
      console.error("Error otorgando logro:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Verificar y otorgar logros automáticamente
  static async checkAndGrantAchievements(req, res) {
    try {
      const { userId } = req.params;

      const grantedAchievements = await Achievement.checkAndGrantAchievements(
        parseInt(userId)
      );

      res.json({
        success: true,
        message: "Verificación de logros completada",
        data: {
          granted_achievements: grantedAchievements,
          count: grantedAchievements.length,
        },
      });
    } catch (error) {
      console.error("Error verificando logros:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener estadísticas de logros
  static async getAchievementStats(req, res) {
    try {
      const stats = await Achievement.getAchievementStats();
      const popularAchievements = await Achievement.getPopularAchievements(5);

      res.json({
        success: true,
        message: "Estadísticas de logros obtenidas exitosamente",
        data: {
          stats,
          popular_achievements: popularAchievements,
        },
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas de logros:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // ===== GESTIÓN DE EXPERIENCIA =====

  // Agregar experiencia a un usuario
  static async addExperience(req, res) {
    try {
      const { userId } = req.params;
      const { experiencePoints } = req.body;

      const result = await Level.addExperience(
        parseInt(userId),
        parseInt(experiencePoints)
      );

      res.json({
        success: true,
        message: "Experiencia agregada exitosamente",
        data: result,
      });
    } catch (error) {
      console.error("Error agregando experiencia:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener progreso de nivel de un usuario
  static async getUserLevelProgress(req, res) {
    try {
      const { userId } = req.params;

      const progress = await Level.getLevelProgress(parseInt(userId));

      res.json({
        success: true,
        message: "Progreso de nivel obtenido exitosamente",
        data: { progress },
      });
    } catch (error) {
      console.error("Error obteniendo progreso de nivel:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // ===== GESTIÓN DE PREMIOS =====

  // Obtener todos los premios
  static async getAllRewards(req, res) {
    try {
      const rewards = await Reward.getAllRewards();

      res.json({
        success: true,
        message: "Premios obtenidos exitosamente",
        data: { rewards },
      });
    } catch (error) {
      console.error("Error obteniendo premios:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Crear nuevo premio
  static async createReward(req, res) {
    try {
      const rewardData = {
        ...req.body,
        created_by: req.user.id,
      };

      const result = await Reward.createReward(rewardData);

      res.status(201).json({
        success: true,
        message: "Premio creado exitosamente",
        data: { reward_id: result.lastID },
      });
    } catch (error) {
      console.error("Error creando premio:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Actualizar premio
  static async updateReward(req, res) {
    try {
      const { id } = req.params;
      const rewardData = req.body;

      await Reward.updateReward(parseInt(id), rewardData);

      res.json({
        success: true,
        message: "Premio actualizado exitosamente",
      });
    } catch (error) {
      console.error("Error actualizando premio:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Eliminar premio
  static async deleteReward(req, res) {
    try {
      const { id } = req.params;

      await Reward.deleteReward(parseInt(id));

      res.json({
        success: true,
        message: "Premio eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando premio:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener premios de un usuario específico
  static async getUserRewards(req, res) {
    try {
      const { userId } = req.params;
      const rewards = await Reward.getUserRewards(parseInt(userId));

      res.json({
        success: true,
        message: "Premios del usuario obtenidos exitosamente",
        data: { rewards },
      });
    } catch (error) {
      console.error("Error obteniendo premios del usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Canjear premio
  static async redeemReward(req, res) {
    try {
      const { userId, rewardId } = req.body;

      const reward = await Reward.redeemReward(parseInt(userId), parseInt(rewardId));

      res.json({
        success: true,
        message: "Premio canjeado exitosamente",
        data: { reward },
      });
    } catch (error) {
      console.error("Error canjeando premio:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Obtener estadísticas de premios
  static async getRewardStats(req, res) {
    try {
      const stats = await Reward.getRewardStats();

      res.json({
        success: true,
        message: "Estadísticas de premios obtenidas exitosamente",
        data: stats,
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas de premios:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = LevelsController;
