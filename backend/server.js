const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const database = require("./config/database");

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const gameRoutes = require("./routes/games");
const dashboardRoutes = require("./routes/dashboard");
const levelsRoutes = require("./routes/levels");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());

// Configurar CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware para parsing JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware de logging básico
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Conectar a la base de datos al iniciar el servidor
async function connectDatabase() {
  try {
    await database.connect();
    console.log("🎯 Servidor conectado a la base de datos");
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error);
    process.exit(1);
  }
}

// Middleware para asegurar que la base de datos esté conectada
app.use(async (req, res, next) => {
  if (!database.db) {
    try {
      await database.connect();
    } catch (error) {
      console.error(
        "❌ Error conectando a la base de datos en middleware:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Error de conexión a la base de datos",
      });
    }
  }
  next();
});

// Rutas principales
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/games", gameRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/levels", levelsRoutes);

// Ruta de salud del servidor
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Shark Math Game API está funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Ruta raíz con información de la API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🦈 Bienvenido a Shark Math Game API",
    version: "1.0.0",
    description:
      "API REST para juego educativo de matemáticas estilo Pacman con tiburón",
    endpoints: {
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        verify: "GET /auth/verify",
        logout: "POST /auth/logout",
      },
      users: {
        myProfile: "GET /users/me",
        updateMyProfile: "PUT /users/me",
        getProfile: "GET /users/:id",
        updateProfile: "PUT /users/:id",
      },
      games: {
        createGame: "POST /games",
        myGames: "GET /games/my-games",
        myGameDetails: "GET /games/my-games/:game_id",
        userGames: "GET /games/:user_id",
        gameDetails: "GET /games/:user_id/:game_id",
      },
      dashboard: {
        students: "GET /dashboard/students",
        studentDetails: "GET /dashboard/students/:id",
        ranking: "GET /dashboard/ranking",
        systemStats: "GET /dashboard/stats",
        analysis: "GET /dashboard/analysis",
        export: "GET /dashboard/export",
        exportStudent: "GET /dashboard/export/:id",
      },
    },
    documentation: "Consulta el README.md para más información",
  });
});

// Middleware para rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    suggestion: "Consulta GET / para ver todas las rutas disponibles",
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error("Error no manejado:", error);

  // Error de validación de JSON
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "JSON inválido en el cuerpo de la solicitud",
    });
  }

  // Error de base de datos SQLite
  if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(400).json({
      success: false,
      message: "Ya existe un registro con esos datos únicos",
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
});

// Manejo graceful de cierre del servidor
async function gracefulShutdown(signal) {
  console.log(`\n📴 Recibida señal ${signal}. Cerrando servidor...`);

  try {
    await database.close();
    console.log("✅ Base de datos cerrada correctamente");

    server.close(() => {
      console.log("✅ Servidor HTTP cerrado correctamente");
      process.exit(0);
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.log("⚠️ Forzando cierre del servidor...");
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error("❌ Error durante el cierre:", error);
    process.exit(1);
  }
}

// Iniciar servidor
const server = app.listen(PORT, async () => {
  console.log("\n🚀 ======================================");
  console.log(`🦈 Shark Math Game API iniciado`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log("🚀 ======================================\n");

  // Conectar a la base de datos
  await connectDatabase();

  console.log("✅ Servidor listo para recibir peticiones\n");
});

// Eventos de cierre del proceso
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  console.error("❌ Excepción no capturada:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promesa rechazada no manejada:", reason);
  process.exit(1);
});

module.exports = app;
