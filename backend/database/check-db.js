const database = require("../config/database");

async function checkDatabaseStatus() {
  try {
    console.log("🔍 Verificando estado de la base de datos...");
    await database.connect();

    console.log("\n" + "=".repeat(60));
    console.log("📊 ESTADO ACTUAL DE LA BASE DE DATOS");
    console.log("=".repeat(60));

    // Obtener lista de todas las tablas
    const tables = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log(`\n✅ Total de tablas: ${tables.length}`);
    console.log("\n📋 Detalles de tablas:");

    // Mostrar cada tabla con información detallada
    for (const table of tables) {
      const tableName = table.name;

      // Obtener estructura de la tabla
      const columns = await database.all(`PRAGMA table_info(${tableName})`);

      // Obtener número de registros
      const countResult = await database.get(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      const recordCount = countResult.count;

      console.log(`\n🔸 ${tableName.toUpperCase()}`);
      console.log(`   📝 Columnas: ${columns.length}`);
      console.log(`   📊 Registros: ${recordCount}`);

      // Mostrar estructura de columnas
      console.log(`   🏗️  Estructura:`);
      columns.forEach((col) => {
        const nullable = col.notnull === 0 ? "NULL" : "NOT NULL";
        const pk = col.pk === 1 ? " (PK)" : "";
        console.log(`      - ${col.name} (${col.type}) ${nullable}${pk}`);
      });
    }

    // Verificar datos específicos importantes
    console.log("\n" + "=".repeat(60));
    console.log("🔍 RESUMEN DE DATOS");
    console.log("=".repeat(60));

    // Verificar usuarios
    const userCount = await database.get("SELECT COUNT(*) as count FROM users");
    const teacherCount = await database.get(
      "SELECT COUNT(*) as count FROM users WHERE role = 'teacher'"
    );
    const studentCount = await database.get(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    );

    console.log(`\n👥 Usuarios totales: ${userCount.count}`);
    console.log(`👨‍🏫 Profesores: ${teacherCount.count}`);
    console.log(`👨‍🎓 Estudiantes: ${studentCount.count}`);

    // Verificar juegos
    const gameCount = await database.get("SELECT COUNT(*) as count FROM games");
    const gameDetailsCount = await database.get(
      "SELECT COUNT(*) as count FROM game_details"
    );
    console.log(`🎮 Partidas jugadas: ${gameCount.count}`);
    console.log(`❓ Preguntas respondidas: ${gameDetailsCount.count}`);

    // Verificar niveles
    const levelCount = await database.get(
      "SELECT COUNT(*) as count FROM level_config"
    );
    const userLevelsCount = await database.get(
      "SELECT COUNT(*) as count FROM user_levels"
    );
    console.log(`⭐ Niveles configurados: ${levelCount.count}`);
    console.log(`📈 Usuarios con niveles: ${userLevelsCount.count}`);

    // Verificar logros
    const achievementCount = await database.get(
      "SELECT COUNT(*) as count FROM achievements"
    );
    const userAchievementsCount = await database.get(
      "SELECT COUNT(*) as count FROM user_achievements"
    );
    console.log(`🏆 Logros configurados: ${achievementCount.count}`);
    console.log(`🎖️ Logros otorgados: ${userAchievementsCount.count}`);

    // Verificar premios
    const rewardCount = await database.get(
      "SELECT COUNT(*) as count FROM rewards"
    );
    const userRewardsCount = await database.get(
      "SELECT COUNT(*) as count FROM user_rewards"
    );
    console.log(`🎁 Premios configurados: ${rewardCount.count}`);
    console.log(`🎉 Premios otorgados: ${userRewardsCount.count}`);

    // Verificar índices
    const indexes = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    console.log(`🔍 Índices creados: ${indexes.length}`);

    // Mostrar algunos índices importantes
    if (indexes.length > 0) {
      console.log(`   📋 Índices principales:`);
      indexes.slice(0, 5).forEach((index) => {
        console.log(`      - ${index.name}`);
      });
      if (indexes.length > 5) {
        console.log(`      ... y ${indexes.length - 5} más`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICACIÓN COMPLETADA");
    console.log("=".repeat(60));

    // Estado general
    if (userCount.count > 0 && gameCount.count > 0) {
      console.log("🎉 Base de datos funcionando correctamente");
      console.log("✅ Datos de prueba disponibles");
    } else if (userCount.count > 0) {
      console.log("⚠️ Base de datos inicializada pero sin datos de prueba");
      console.log("💡 Ejecuta 'npm run seed-db' para agregar datos de prueba");
    } else {
      console.log("❌ Base de datos vacía");
      console.log("💡 Ejecuta 'npm run init-db' para inicializar");
    }
  } catch (error) {
    console.error("❌ Error verificando base de datos:", error);
    console.error("💡 Asegúrate de que la base de datos esté inicializada");
  } finally {
    await database.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkDatabaseStatus();
}

module.exports = checkDatabaseStatus;
