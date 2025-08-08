// Panel del Estudiante - JavaScript

// Configuración de la API
const API_BASE_URL = "http://localhost:3000";

// Estado global del estudiante
const studentState = {
  currentUser: null,
  myGames: [],
  stats: {},
};

// Utilidades para API (igual que en app.js y dashboard.js)
const apiUtils = {
  async makeRequest(endpoint, options = {}) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Agregar token si existe
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en la petición");
      }

      return data;
    } catch (error) {
      console.error("Error en API:", error);
      throw error;
    }
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  clearUser() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  },

  isLoggedIn() {
    return !!localStorage.getItem("token");
  },
};

// Utilidades para UI
const uiUtils = {
  showLoading() {
    document.getElementById("loading-overlay").classList.add("active");
  },

  hideLoading() {
    document.getElementById("loading-overlay").classList.remove("active");
  },

  formatNumber(num) {
    return num ? num.toLocaleString("es-ES") : "0";
  },

  formatPercentage(num) {
    return num ? `${Math.round(num * 100) / 100}%` : "0%";
  },

  formatScore(score) {
    return score ? Math.round(score * 100) / 100 : 0;
  },

  getStudentLevel(avgScore) {
    if (avgScore >= 90) return "🏆 Experto";
    if (avgScore >= 80) return "⭐ Avanzado";
    if (avgScore >= 70) return "📈 Intermedio";
    if (avgScore >= 60) return "🌱 Principiante";
    return "🚀 Empezando";
  },
};

// Gestión de autenticación
const authManager = {
  async verifyAuth() {
    if (!apiUtils.isLoggedIn()) {
      window.location.href = "index.html";
      return false;
    }

    try {
      const response = await apiUtils.makeRequest("/auth/verify");
      const user = apiUtils.getUser();

      if (!user || user.user.role !== "student") {
        throw new Error("Acceso no autorizado");
      }

      studentState.currentUser = user;
      document.getElementById("student-name").textContent = user.user.name;
      document.getElementById("student-email").textContent = user.user.email;
      document.getElementById("registration-date").textContent = new Date(
        user.user.created_at || Date.now()
      ).toLocaleDateString("es-ES");

      return true;
    } catch (error) {
      console.error("Error de autenticación:", error);
      apiUtils.clearUser();
      window.location.href = "index.html";
      return false;
    }
  },

  async logout() {
    try {
      await apiUtils.makeRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      apiUtils.clearUser();
      window.location.href = "index.html";
    }
  },
};

// Gestión de datos del estudiante
const dataManager = {
  async loadMyProfile() {
    try {
      const response = await apiUtils.makeRequest("/users/me");
      // Actualizar información del perfil si es necesario
      return response.data;
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  },

  async loadMyGames() {
    try {
      const response = await apiUtils.makeRequest("/games/my-games?limit=10");
      studentState.myGames = response.data.games || [];
      this.updateGamesUI();
      this.calculateStats();
    } catch (error) {
      console.error("Error cargando mis partidas:", error);
      studentState.myGames = [];
      this.updateGamesUI();
    }
  },

  calculateStats() {
    const games = studentState.myGames;

    if (games.length === 0) {
      studentState.stats = {
        totalGames: 0,
        bestScore: 0,
        avgScore: 0,
        accuracy: 0,
      };
    } else {
      const totalGames = games.length;
      const bestScore = Math.max(...games.map((game) => game.score));
      const avgScore =
        games.reduce((sum, game) => sum + game.score, 0) / totalGames;
      const totalCorrect = games.reduce(
        (sum, game) => sum + game.correct_answers,
        0
      );
      const totalQuestions = games.reduce(
        (sum, game) => sum + game.total_questions,
        0
      );
      const accuracy =
        totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      studentState.stats = {
        totalGames,
        bestScore,
        avgScore,
        accuracy,
      };
    }

    this.updateStatsUI();
  },

  updateStatsUI() {
    const stats = studentState.stats;

    document.getElementById("total-games").textContent = uiUtils.formatNumber(
      stats.totalGames
    );

    document.getElementById("best-score").textContent = uiUtils.formatScore(
      stats.bestScore
    );

    document.getElementById("avg-score").textContent = uiUtils.formatScore(
      stats.avgScore
    );

    document.getElementById("accuracy").textContent = uiUtils.formatPercentage(
      stats.accuracy
    );

    // Actualizar nivel del estudiante
    document.getElementById("student-level").textContent =
      uiUtils.getStudentLevel(stats.avgScore);
  },

  updateGamesUI() {
    const container = document.getElementById("games-list");
    container.innerHTML = "";

    if (studentState.myGames.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
          <h4>🎮 ¡No hay partidas aún!</h4>
          <p>Juega tu primera partida para ver tu historial aquí.</p>
          <button class="play-btn" onclick="startGame()" style="margin-top: 15px; padding: 10px 20px; font-size: 1rem;">
            🌊 ¡Empezar a Jugar!
          </button>
        </div>
      `;
      return;
    }

    studentState.myGames.forEach((game) => {
      const gameElement = document.createElement("div");
      gameElement.className = "game-item";

      const playedDate = new Date(game.played_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const duration = game.duration
        ? `${Math.floor(game.duration / 60)}:${(game.duration % 60)
            .toString()
            .padStart(2, "0")}`
        : "N/A";

      gameElement.innerHTML = `
        <div class="game-info">
          <h5>🎯 Partida del ${playedDate}</h5>
          <p>✅ Correctas: ${game.correct_answers}/${game.total_questions}</p>
          <p>⏱️ Duración: ${duration}</p>
          <p>📅 ${playedDate}</p>
        </div>
        <div class="game-score">
          <div class="score-value">${game.score}</div>
          <div class="score-label">puntos</div>
        </div>
      `;

      container.appendChild(gameElement);
    });
  },
};

// Funciones globales para eventos
window.startGame = function () {
  // Por ahora, mostrar un mensaje
  alert("🎮 El juego está en desarrollo. ¡Pronto podrás jugar!");

  // TODO: Aquí se implementaría la navegación al juego real
  // window.location.href = 'game.html';
};

window.editProfile = function () {
  // Por ahora, mostrar un mensaje
  alert("✏️ Función de edición de perfil en desarrollo.");

  // TODO: Implementar modal de edición de perfil
};

// Inicialización del panel del estudiante
async function initStudentPanel() {
  try {
    uiUtils.showLoading();

    // Verificar autenticación
    const isAuthenticated = await authManager.verifyAuth();
    if (!isAuthenticated) return;

    // Configurar event listeners
    setupEventListeners();

    // Cargar datos del estudiante
    await Promise.all([dataManager.loadMyProfile(), dataManager.loadMyGames()]);
  } catch (error) {
    console.error("Error inicializando panel del estudiante:", error);
    alert("Error al cargar el panel del estudiante");
  } finally {
    uiUtils.hideLoading();
  }
}

// Event listeners principales
function setupEventListeners() {
  // Botón de logout
  document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      authManager.logout();
    }
  });

  // Botón de refresh del historial
  document.getElementById("refresh-history").addEventListener("click", () => {
    dataManager.loadMyGames();
  });

  // Botón de jugar en la sección de bienvenida
  document
    .querySelector(".welcome-card .play-btn")
    .addEventListener("click", startGame);
}

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", initStudentPanel);
