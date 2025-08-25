const User = require("../models/User");

class UserController {
  // Obtener perfil de usuario
  static async getProfile(req, res) {
    try {
      const userId = parseInt(req.params.id);

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
          },
        },
      });
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Actualizar perfil de usuario
  static async updateProfile(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const { name, email } = req.body;

      // Verificar si el usuario existe
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Verificar si el email ya existe (excluyendo el usuario actual)
      if (email && email !== existingUser.email) {
        const emailExists = await User.emailExists(email, userId);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "El email ya está en uso por otro usuario",
          });
        }
      }

      // Actualizar solo los campos proporcionados
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      // Si no hay campos para actualizar
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se proporcionaron campos para actualizar",
        });
      }

      const updatedUser = await User.update(userId, updateData);

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            created_at: updatedUser.created_at,
          },
        },
      });
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Obtener perfil del usuario autenticado (método de conveniencia)
  static async getMyProfile(req, res) {
    try {
      const user = req.user; // Viene del middleware de autenticación

      res.json({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
          },
        },
      });
    } catch (error) {
      console.error("Error obteniendo mi perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Actualizar perfil del usuario autenticado
  static async updateMyProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, email, currentPassword, newPassword } = req.body;

      // Si se quiere cambiar la contraseña, verificar la actual
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: "Debes proporcionar tu contraseña actual para cambiarla",
          });
        }

        // Obtener usuario con contraseña para verificación
        const userWithPassword = await User.findByIdWithPassword(userId);
        const isValidPassword = await User.verifyPassword(currentPassword, userWithPassword.password);
        
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            message: "La contraseña actual es incorrecta",
          });
        }

        // Validar longitud de nueva contraseña
        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: "La nueva contraseña debe tener al menos 6 caracteres",
          });
        }
      }

      // Verificar si el email ya existe (excluyendo el usuario actual)
      if (email && email !== req.user.email) {
        const emailExists = await User.emailExists(email, userId);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "El email ya está en uso por otro usuario",
          });
        }
      }

      // Actualizar solo los campos proporcionados
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      let updatedUser;

      // Si hay campos básicos para actualizar
      if (Object.keys(updateData).length > 0) {
        updatedUser = await User.update(userId, updateData);
      }

      // Si hay que cambiar la contraseña
      if (newPassword) {
        updatedUser = await User.updatePassword(userId, newPassword);
      }

      // Si no hay campos para actualizar
      if (Object.keys(updateData).length === 0 && !newPassword) {
        return res.status(400).json({
          success: false,
          message: "No se proporcionaron campos para actualizar",
        });
      }

      // Si no se actualizó nada, obtener usuario actual
      if (!updatedUser) {
        updatedUser = await User.findById(userId);
      }

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            created_at: updatedUser.created_at,
          },
        },
      });
    } catch (error) {
      console.error("Error actualizando mi perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = UserController;
