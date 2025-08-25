const database = require("../config/database");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    console.log("🌱 Sembrando datos de prueba...");

    // Conectar a la base de datos
    await database.connect();

    // Limpiar datos existentes (pero mantener el profesor)
    await database.run("DELETE FROM game_details");
    await database.run("DELETE FROM games");
    await database.run("DELETE FROM users WHERE role = 'student'");

    // Crear estudiantes con más variedad
    const students = [
      { name: "Ana García", email: "ana@ejemplo.com" },
      { name: "Carlos López", email: "carlos@ejemplo.com" },
      { name: "María Rodríguez", email: "maria@ejemplo.com" },
      { name: "Juan Pérez", email: "juan@ejemplo.com" },
      { name: "Sofía Martín", email: "sofia@ejemplo.com" },
      { name: "Diego Fernández", email: "diego@ejemplo.com" },
      { name: "Lucía Torres", email: "lucia@ejemplo.com" },
      { name: "Mateo Silva", email: "mateo@ejemplo.com" },
      { name: "Valentina Cruz", email: "valentina@ejemplo.com" },
      { name: "Santiago Morales", email: "santiago@ejemplo.com" },
      { name: "Emma Vargas", email: "emma@ejemplo.com" },
      { name: "Nicolás Herrera", email: "nicolas@ejemplo.com" },
      { name: "Isabella Ramos", email: "isabella@ejemplo.com" },
      { name: "Gabriel Ortega", email: "gabriel@ejemplo.com" },
      { name: "Camila Jiménez", email: "camila@ejemplo.com" },
    ];

    const hashedPassword = await bcrypt.hash("estudiante123", 10);

    // Insertar estudiantes
    const studentIds = [];
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const result = await database.run(
        `INSERT INTO users (name, email, password, role, created_at) 
         VALUES (?, ?, ?, 'student', datetime('now', '-' || ? || ' days'))`,
        [
          student.name,
          student.email,
          hashedPassword,
          Math.floor(Math.random() * 60) + 1,
        ]
      );
      studentIds.push(result.id);
      console.log(`✅ Estudiante creado: ${student.name}`);
    }

    // Crear partidas variadas para cada estudiante
    const questionBanks = [
      { q: "5 + 3 = ?", correct: "8" },
      { q: "12 - 7 = ?", correct: "5" },
      { q: "4 × 6 = ?", correct: "24" },
      { q: "15 ÷ 3 = ?", correct: "5" },
      { q: "8 + 9 = ?", correct: "17" },
      { q: "20 - 8 = ?", correct: "12" },
      { q: "7 × 3 = ?", correct: "21" },
      { q: "18 ÷ 2 = ?", correct: "9" },
      { q: "6 + 4 = ?", correct: "10" },
      { q: "14 - 6 = ?", correct: "8" },
      { q: "5 × 5 = ?", correct: "25" },
      { q: "24 ÷ 4 = ?", correct: "6" },
      { q: "9 + 7 = ?", correct: "16" },
      { q: "16 - 9 = ?", correct: "7" },
      { q: "8 × 4 = ?", correct: "32" },
      { q: "21 ÷ 7 = ?", correct: "3" },
      { q: "11 + 6 = ?", correct: "17" },
      { q: "19 - 11 = ?", correct: "8" },
      { q: "6 × 7 = ?", correct: "42" },
      { q: "36 ÷ 6 = ?", correct: "6" },
    ];

    let totalGames = 0;

    // Para cada estudiante, crear entre 8-25 partidas
    for (const studentId of studentIds) {
      const numGames = Math.floor(Math.random() * 18) + 8; // 8-25 partidas

      for (let gameNum = 0; gameNum < numGames; gameNum++) {
        // Generar datos de partida variables
        const totalQuestions = Math.floor(Math.random() * 6) + 10; // 10-15 preguntas
        const correctRate = 0.4 + Math.random() * 0.5; // 40%-90% de acierto
        const correctAnswers = Math.floor(totalQuestions * correctRate);
        const wrongAnswers = totalQuestions - correctAnswers;
        const score =
          Math.floor(correctAnswers * 8.5) + Math.floor(Math.random() * 15); // Score basado en aciertos
        const duration = Math.floor(Math.random() * 300) + 120; // 2-7 minutos

        // Fecha aleatoria en los últimos 45 días
        const daysAgo = Math.floor(Math.random() * 45);

        // Fecha de inicio y fin de la partida
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - daysAgo);
        startTime.setHours(
          startTime.getHours() - Math.floor(Math.random() * 12)
        );

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);

        // Insertar la partida
        const gameResult = await database.run(
          `INSERT INTO games (user_id, score, correct_answers, wrong_answers, total_questions, duration, played_at, ended_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            studentId,
            score,
            correctAnswers,
            wrongAnswers,
            totalQuestions,
            duration,
            startTime.toISOString(),
            endTime.toISOString(),
          ]
        );

        const gameId = gameResult.id;

        // Crear preguntas para esta partida
        const gameQuestions = [];
        const usedQuestions = new Set();

        for (let q = 0; q < totalQuestions; q++) {
          let questionIndex;
          do {
            questionIndex = Math.floor(Math.random() * questionBanks.length);
          } while (
            usedQuestions.has(questionIndex) &&
            usedQuestions.size < questionBanks.length
          );

          usedQuestions.add(questionIndex);
          const baseQuestion = questionBanks[questionIndex];

          // Determinar si es correcta basado en la tasa de acierto
          const isCorrect =
            gameQuestions.filter((q) => q.is_correct).length < correctAnswers;

          // Generar respuesta del usuario
          let userAnswer;
          if (isCorrect) {
            userAnswer = baseQuestion.correct;
          } else {
            // Generar respuesta incorrecta
            const correctNum = parseInt(baseQuestion.correct);
            const wrongOffset =
              (Math.random() < 0.5 ? -1 : 1) *
              (Math.floor(Math.random() * 5) + 1);
            userAnswer = Math.max(0, correctNum + wrongOffset).toString();
          }

          gameQuestions.push({
            question: baseQuestion.q,
            user_answer: userAnswer,
            correct_answer: baseQuestion.correct,
            is_correct: isCorrect,
          });
        }

        // Insertar detalles de preguntas
        for (const question of gameQuestions) {
          await database.run(
            `INSERT INTO game_details (game_id, question, user_answer, correct_answer, is_correct)
             VALUES (?, ?, ?, ?, ?)`,
            [
              gameId,
              question.question,
              question.user_answer,
              question.correct_answer,
              question.is_correct ? 1 : 0,
            ]
          );
        }

        totalGames++;
      }
    }

    console.log(`🎮 Se crearon ${totalGames} partidas de prueba`);

    // Crear algunas partidas recientes adicionales para mostrar actividad
    console.log("🕐 Creando partidas recientes...");

    for (let i = 0; i < 10; i++) {
      const randomStudentId =
        studentIds[Math.floor(Math.random() * studentIds.length)];
      const totalQuestions = 12;
      const correctAnswers = Math.floor(Math.random() * 8) + 6; // 6-13 correctas
      const wrongAnswers = totalQuestions - correctAnswers;
      const score = correctAnswers * 8 + Math.floor(Math.random() * 20);
      const duration = Math.floor(Math.random() * 180) + 120;

      const gameResult = await database.run(
        `INSERT INTO games (user_id, score, correct_answers, wrong_answers, total_questions, duration, played_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'), datetime('now', '-' || ? || ' hours', '+' || ? || ' minutes'))`,
        [
          randomStudentId,
          score,
          correctAnswers,
          wrongAnswers,
          totalQuestions,
          duration,
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 24),
          Math.floor(duration / 60),
        ]
      );

      // Agregar algunas preguntas básicas para esta partida
      for (let q = 0; q < totalQuestions; q++) {
        const questionIndex = Math.floor(Math.random() * questionBanks.length);
        const baseQuestion = questionBanks[questionIndex];
        const isCorrect = q < correctAnswers;

        let userAnswer;
        if (isCorrect) {
          userAnswer = baseQuestion.correct;
        } else {
          const correctNum = parseInt(baseQuestion.correct);
          userAnswer = (
            correctNum +
            Math.floor(Math.random() * 5) +
            1
          ).toString();
        }

        await database.run(
          `INSERT INTO game_details (game_id, question, user_answer, correct_answer, is_correct)
           VALUES (?, ?, ?, ?, ?)`,
          [
            gameResult.id,
            baseQuestion.q,
            userAnswer,
            baseQuestion.correct,
            isCorrect ? 1 : 0,
          ]
        );
      }
    }

    // Crear niveles de usuario y otorgar logros
    console.log("🎖️ Asignando niveles y logros a estudiantes...");
    
    for (const studentId of studentIds) {
      // Calcular experiencia basada en partidas jugadas
      const studentGames = await database.get(
        "SELECT COUNT(*) as games_count, AVG(score) as avg_score, MAX(score) as max_score FROM games WHERE user_id = ?",
        [studentId]
      );
      
      const gamesPlayed = studentGames.games_count || 0;
      const avgScore = studentGames.avg_score || 0;
      const maxScore = studentGames.max_score || 0;
      
      // Calcular experiencia: 10 puntos por partida + puntos de puntuación promedio
      const totalExperience = Math.floor(gamesPlayed * 10 + avgScore * 2);
      
      // Determinar nivel actual basado en experiencia
      const levelResult = await database.get(
        "SELECT level_number FROM level_config WHERE experience_required <= ? ORDER BY experience_required DESC LIMIT 1",
        [totalExperience]
      );
      
      const currentLevel = levelResult ? levelResult.level_number : 1;
      const currentExperience = totalExperience;
      
      // Insertar o actualizar nivel del usuario
      await database.run(
        `INSERT OR REPLACE INTO user_levels (user_id, current_level, current_experience, total_experience, last_level_up)
         VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))`,
        [studentId, currentLevel, currentExperience, totalExperience, Math.floor(Math.random() * 30)]
      );
      
      // Otorgar logros basados en criterios
      const achievements = await database.all("SELECT * FROM achievements WHERE is_active = 1");
      
      for (const achievement of achievements) {
        let shouldGrant = false;
        
        switch (achievement.criteria_type) {
          case 'games_played':
            shouldGrant = gamesPlayed >= achievement.criteria_value;
            break;
          case 'score_reached':
            shouldGrant = maxScore >= achievement.criteria_value;
            break;
          case 'level_reached':
            shouldGrant = currentLevel >= achievement.criteria_value;
            break;
          case 'accuracy_percentage':
            // Calcular precisión promedio
            const accuracyResult = await database.get(
              "SELECT AVG(CAST(correct_answers AS FLOAT) / total_questions * 100) as avg_accuracy FROM games WHERE user_id = ? AND total_questions > 0",
              [studentId]
            );
            const avgAccuracy = accuracyResult.avg_accuracy || 0;
            shouldGrant = avgAccuracy >= achievement.criteria_value;
            break;
          case 'total_points':
            const totalPointsResult = await database.get(
              "SELECT SUM(score) as total_points FROM games WHERE user_id = ?",
              [studentId]
            );
            const totalPoints = totalPointsResult.total_points || 0;
            shouldGrant = totalPoints >= achievement.criteria_value;
            break;
        }
        
        if (shouldGrant) {
          // Verificar si ya tiene el logro
          const hasAchievement = await database.get(
            "SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?",
            [studentId, achievement.id]
          );
          
          if (!hasAchievement) {
            await database.run(
              "INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES (?, ?, datetime('now', '-' || ? || ' days'))",
              [studentId, achievement.id, Math.floor(Math.random() * 15)]
            );
          }
        }
      }
    }

    // Mostrar estadísticas finales
    const totalStudents = await database.get(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    );
    const totalGamesCount = await database.get(
      "SELECT COUNT(*) as count FROM games"
    );
    const avgScore = await database.get("SELECT AVG(score) as avg FROM games");
    
    // Estadísticas de niveles y logros
    const levelStats = await database.get(
      "SELECT COUNT(*) as total_levels, AVG(current_level) as avg_level, MAX(current_level) as max_level FROM user_levels"
    );
    const achievementStats = await database.get(
      "SELECT COUNT(*) as total_granted FROM user_achievements"
    );
    const totalAchievements = await database.get(
      "SELECT COUNT(*) as total FROM achievements WHERE is_active = 1"
    );

    console.log("\n📊 Estadísticas de la base de datos:");
    console.log(`👥 Total estudiantes: ${totalStudents.count}`);
    console.log(`🎮 Total partidas: ${totalGamesCount.count}`);
    console.log(
      `📈 Puntuación promedio: ${Math.round(avgScore.avg * 100) / 100}`
    );
    console.log(`⭐ Nivel promedio: ${Math.round((levelStats.avg_level || 0) * 100) / 100}`);
    console.log(`🏆 Logros otorgados: ${achievementStats.total_granted}/${totalAchievements.total * totalStudents.count}`);
    console.log(`🎖️ Nivel más alto alcanzado: ${levelStats.max_level || 1}`);

    console.log("\n🎉 ¡Datos de prueba creados exitosamente!");
    console.log("\n👨‍🏫 Credenciales del profesor:");
    console.log("   Email: profesor@ejemplo.com");
    console.log("   Password: profesor123");
    console.log("\n👨‍🎓 Credenciales de estudiantes:");
    console.log("   Email: [nombre]@ejemplo.com");
    console.log("   Password: estudiante123");
    console.log("   Ejemplo: ana@ejemplo.com / estudiante123");
  } catch (error) {
    console.error("❌ Error sembrando datos:", error);
    throw error;
  } finally {
    await database.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✅ Proceso completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
