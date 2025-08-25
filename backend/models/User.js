const database = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  // Crear un nuevo usuario
  static async create(userData) {
    const { name, email, password, role = "student" } = userData;

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await database.run(
      `
            INSERT INTO users (name, email, password, role, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `,
      [name, email, hashedPassword, role]
    );

    return {
      id: result.id,
      name,
      email,
      role,
      created_at: new Date().toISOString(),
    };
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const user = await database.get(
      `
            SELECT * FROM users WHERE email = ?
        `,
      [email]
    );

    return user;
  }

  // Buscar usuario por ID
  static async findById(id) {
    const user = await database.get(
      `
            SELECT id, name, email, role, created_at FROM users WHERE id = ?
        `,
      [id]
    );

    return user;
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar usuario
  static async update(id, userData) {
    const { name, email } = userData;

    await database.run(
      `
            UPDATE users 
            SET name = ?, email = ?
            WHERE id = ?
        `,
      [name, email, id]
    );

    return await this.findById(id);
  }

  // Actualizar contraseña
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await database.run(
      `
            UPDATE users 
            SET password = ?
            WHERE id = ?
        `,
      [hashedPassword, id]
    );

    return await this.findById(id);
  }

  // Obtener usuario con contraseña (para verificación)
  static async findByIdWithPassword(id) {
    const user = await database.get(
      `
            SELECT * FROM users WHERE id = ?
        `,
      [id]
    );

    return user;
  }

  // Obtener todos los estudiantes con estadísticas resumidas
  static async getStudentsWithStats() {
    const students = await database.all(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.created_at,
                COUNT(g.id) as total_games,
                COALESCE(AVG(g.score), 0) as avg_score,
                COALESCE(MAX(g.score), 0) as best_score,
                COALESCE(SUM(g.correct_answers), 0) as total_correct,
                COALESCE(SUM(g.wrong_answers), 0) as total_wrong,
                COALESCE(SUM(g.total_questions), 0) as total_questions,
                COALESCE(SUM(g.duration), 0) as total_time_played,
                CASE 
                    WHEN SUM(g.total_questions) > 0 
                    THEN ROUND((SUM(g.correct_answers) * 100.0) / SUM(g.total_questions), 2)
                    ELSE 0 
                END as accuracy_percentage
            FROM users u
            LEFT JOIN games g ON u.id = g.user_id
            WHERE u.role = 'student'
            GROUP BY u.id, u.name, u.email, u.created_at
            ORDER BY avg_score DESC
        `);

    return students;
  }

  // Obtener ranking de estudiantes
  static async getStudentsRanking() {
    const ranking = await database.all(`
            SELECT 
                u.id,
                u.name,
                u.email,
                COUNT(g.id) as total_games,
                COALESCE(AVG(g.score), 0) as avg_score,
                COALESCE(MAX(g.score), 0) as best_score,
                CASE 
                    WHEN SUM(g.total_questions) > 0 
                    THEN ROUND((SUM(g.correct_answers) * 100.0) / SUM(g.total_questions), 2)
                    ELSE 0 
                END as accuracy_percentage
            FROM users u
            LEFT JOIN games g ON u.id = g.user_id
            WHERE u.role = 'student'
            GROUP BY u.id, u.name, u.email
            ORDER BY avg_score DESC, accuracy_percentage DESC, total_games DESC
            LIMIT 20
        `);

    return ranking;
  }

  // Verificar si el email ya existe
  static async emailExists(email, excludeId = null) {
    let query = "SELECT id FROM users WHERE email = ?";
    let params = [email];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const user = await database.get(query, params);
    return !!user;
  }
}

module.exports = User;
