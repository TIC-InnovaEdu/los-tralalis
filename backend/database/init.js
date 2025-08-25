const fs = require("fs");
const path = require("path");
const database = require("../config/database");
const bcrypt = require("bcryptjs");

async function showDatabaseStatus() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📊 VERIFICACIÓN DE TABLAS CREADAS");
    console.log("=".repeat(60));

    // Obtener lista de todas las tablas
    const tables = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log(`\n✅ Total de tablas creadas: ${tables.length}`);
    console.log("\n📋 Lista de tablas:");

    // Mostrar cada tabla con información básica
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

      // Mostrar algunas columnas principales
      const mainColumns = columns
        .slice(0, 3)
        .map((col) => col.name)
        .join(", ");
      console.log(
        `   🏷️  Columnas principales: ${mainColumns}${
          columns.length > 3 ? "..." : ""
        }`
      );
    }

    // Verificar datos específicos importantes
    console.log("\n" + "=".repeat(60));
    console.log("🔍 VERIFICACIÓN DE DATOS CRÍTICOS");
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

    // Verificar niveles
    const levelCount = await database.get(
      "SELECT COUNT(*) as count FROM level_config"
    );
    console.log(`⭐ Niveles configurados: ${levelCount.count}`);

    // Verificar logros
    const achievementCount = await database.get(
      "SELECT COUNT(*) as count FROM achievements"
    );
    console.log(`🏆 Logros configurados: ${achievementCount.count}`);

    // Verificar índices
    const indexes = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    console.log(`🔍 Índices creados: ${indexes.length}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log("🎉 Base de datos lista para usar!");
    console.log(
      "🚀 Puedes ejecutar 'npm run seed-db' para poblar con datos de prueba"
    );
  } catch (error) {
    console.error("❌ Error verificando base de datos:", error);
  }
}

async function initializeDatabase() {
  try {
    console.log("🚀 Inicializando base de datos con esquema consolidado...");

    // Conectar a la base de datos
    await database.connect();

    // Leer el archivo schema.sql consolidado
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Dividir por declaraciones SQL (separadas por ';')
    const statements = schema
      .split(";")
      .filter((stmt) => stmt.trim().length > 0);

    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...`);

    // Ejecutar cada declaración
    for (const statement of statements) {
      if (statement.trim()) {
        await database.run(statement.trim());
      }
    }

    console.log("✅ Esquema SQL ejecutado correctamente");

    // Crear usuario profesor de ejemplo con password hasheado (actualizar el existente)
    const hashedPassword = await bcrypt.hash("profesor123", 10);

    try {
      await database.run(
        `
        UPDATE users 
        SET password = ? 
        WHERE email = 'profesor@ejemplo.com' AND role = 'teacher'
        `,
        [hashedPassword]
      );

      console.log("👨‍🏫 Usuario profesor actualizado:");
      console.log("   Email: profesor@ejemplo.com");
      console.log("   Password: profesor123");
    } catch (error) {
      console.log("ℹ️ Usuario profesor ya existe con password actualizado");
    }

    // Crear algunos estudiantes de ejemplo
    const students = [
      {
        name: "Ana García",
        email: "ana@ejemplo.com",
        password: "estudiante123",
      },
      {
        name: "Carlos López",
        email: "carlos@ejemplo.com",
        password: "estudiante123",
      },
      {
        name: "María Rodríguez",
        email: "maria@ejemplo.com",
        password: "estudiante123",
      },
    ];

    for (const student of students) {
      try {
        const hashedStudentPassword = await bcrypt.hash(student.password, 10);
        await database.run(
          `
          INSERT OR IGNORE INTO users (name, email, password, role) 
          VALUES (?, ?, ?, 'student')
          `,
          [student.name, student.email, hashedStudentPassword]
        );
      } catch (error) {
        // Usuario ya existe, continuar
      }
    }

    console.log(
      "👥 Usuarios estudiantes de ejemplo creados (password: estudiante123)"
    );
    console.log("📊 Niveles y logros por defecto insertados");
    console.log(
      "✅ Base de datos inicializada correctamente con esquema consolidado"
    );

    // Mostrar verificación de tablas
    await showDatabaseStatus();
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
