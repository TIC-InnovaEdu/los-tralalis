// Dashboard del Profesor - JavaScript

// Configuración de la API
const API_BASE_URL = "http://localhost:3000";

// Estado global del dashboard
const dashboardState = {
  currentUser: null,
  currentSection: "overview",
  students: [],
  rankings: [],
  levels: [],
  achievements: [],
  rewards: [],
  levelsStats: {},
  systemStats: {},
  chartData: {},
  charts: {},
};

// Utilidades para API (igual que en app.js)
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

  showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll(".dashboard-section").forEach((section) => {
      section.classList.remove("active");
    });

    // Remover active de botones de navegación
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Mostrar sección seleccionada
    document.getElementById(`${sectionName}-section`).classList.add("active");
    document
      .querySelector(`[data-section="${sectionName}"]`)
      .classList.add("active");

    dashboardState.currentSection = sectionName;
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

      if (!user || user.user.role !== "teacher") {
        throw new Error("Acceso no autorizado");
      }

      dashboardState.currentUser = user;
      document.getElementById("teacher-name").textContent = user.user.name;
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

// Gestión de datos del dashboard
const dataManager = {
  async loadSystemStats() {
    try {
      const response = await apiUtils.makeRequest("/dashboard/stats");

      // Adaptar la estructura de datos del backend al frontend
      const stats = response.data.system_stats;
      dashboardState.systemStats = {
        total_students: stats.active_students || 0,
        total_games: stats.total_games || 0,
        average_score: stats.avg_score || 0,
        average_accuracy: stats.system_accuracy || 0,
      };

      // Guardar datos para gráficos
      dashboardState.chartData = {
        weeklyProgress: response.data.weekly_progress || [],
        scoreDistribution: response.data.score_distribution || {},
      };

      this.updateOverviewUI();
    } catch (error) {
      console.error("Error cargando estadísticas del sistema:", error);
      // Mostrar datos de ejemplo si hay error
      dashboardState.systemStats = {
        total_students: 0,
        total_games: 0,
        average_score: 0,
        average_accuracy: 0,
      };
      dashboardState.chartData = {
        weeklyProgress: [],
        scoreDistribution: {},
      };
      this.updateOverviewUI();
    }
  },

  async loadStudents() {
    try {
      const response = await apiUtils.makeRequest("/dashboard/students");
      dashboardState.students = response.data.students || [];
      this.updateStudentsUI();
    } catch (error) {
      console.error("Error cargando estudiantes:", error);
      dashboardState.students = [];
      this.updateStudentsUI();
    }
  },

  async loadRanking() {
    try {
      console.log("🔄 Cargando ranking...");
      const response = await apiUtils.makeRequest("/dashboard/ranking");
      console.log("📊 Respuesta del ranking:", response);
      dashboardState.rankings = response.data.ranking || [];
      console.log("🏆 Ranking cargado:", dashboardState.rankings);
      this.updateRankingUI();
    } catch (error) {
      console.error("❌ Error cargando ranking:", error);
      dashboardState.rankings = [];
      this.updateRankingUI();
    }
  },

  async loadLevels() {
    try {
      console.log("🔄 Cargando niveles...");
      const response = await apiUtils.makeRequest("/levels");
      dashboardState.levels = response.data.levels || [];
      this.updateLevelsUI();
    } catch (error) {
      console.error("❌ Error cargando niveles:", error);
      dashboardState.levels = [];
      this.updateLevelsUI();
    }
  },

  async loadAchievements() {
    try {
      console.log("🔄 Cargando logros...");
      const response = await apiUtils.makeRequest("/levels/achievements");
      dashboardState.achievements = response.data.achievements || [];
      this.updateAchievementsUI();
    } catch (error) {
      console.error("❌ Error cargando logros:", error);
      dashboardState.achievements = [];
      this.updateAchievementsUI();
    }
  },

  async loadRewards() {
    try {
      console.log("🔄 Cargando premios...");
      const response = await apiUtils.makeRequest("/levels/rewards");
      dashboardState.rewards = response.data.rewards || [];
      this.updateRewardsUI();
    } catch (error) {
      console.error("❌ Error cargando premios:", error);
      dashboardState.rewards = [];
      this.updateRewardsUI();
    }
  },

  async loadLevelsStats() {
    try {
      console.log("🔄 Cargando estadísticas de niveles...");
      const [levelsResponse, achievementsResponse, statsResponse] =
        await Promise.all([
          apiUtils.makeRequest("/levels"),
          apiUtils.makeRequest("/levels/achievements"),
          apiUtils.makeRequest("/levels/achievements/stats"),
        ]);

      dashboardState.levels = levelsResponse.data.levels || [];
      dashboardState.achievements =
        achievementsResponse.data.achievements || [];
      dashboardState.levelsStats = statsResponse.data || {};

      this.updateLevelsStatsUI();
    } catch (error) {
      console.error("❌ Error cargando estadísticas de niveles:", error);
    }
  },

  async loadAnalytics(period = "week", metric = "score") {
    try {
      console.log("🔄 Cargando analíticas avanzadas...");
      const response = await apiUtils.makeRequest(
        `/dashboard/analysis?period=${period}&metric=${metric}`
      );
      dashboardState.analytics = response.data;
      this.updateAnalyticsUI();
    } catch (error) {
      console.error("❌ Error cargando analíticas:", error);
    }
  },

  async loadStudentDetails(studentId) {
    try {
      const response = await apiUtils.makeRequest(
        `/dashboard/students/${studentId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error cargando detalles del estudiante:", error);
      throw error;
    }
  },

  updateOverviewUI() {
    const stats = dashboardState.systemStats;

    document.getElementById("total-students").textContent =
      uiUtils.formatNumber(stats.total_students || 0);

    document.getElementById("total-games").textContent = uiUtils.formatNumber(
      stats.total_games || 0
    );

    document.getElementById("average-score").textContent = uiUtils.formatScore(
      stats.average_score || 0
    );

    document.getElementById("average-accuracy").textContent =
      uiUtils.formatPercentage(stats.average_accuracy || 0);

    // Crear gráficos de resumen
    this.createOverviewCharts();
  },

  updateStudentsUI() {
    const container = document.getElementById("students-list");
    container.innerHTML = "";

    if (dashboardState.students.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>No hay estudiantes registrados</h3>
          <p>Los estudiantes aparecerán aquí cuando se registren en el sistema.</p>
          <button class="empty-action-btn">📥 Importar Estudiantes</button>
        </div>
      `;
      return;
    }

    // Actualizar estadísticas rápidas
    this.updateStudentsOverview();

    // Crear tarjetas de estudiantes
    dashboardState.students.forEach((student, index) => {
      const performanceLevel = this.getPerformanceLevel(
        student.stats.avg_score
      );
      const studentElement = document.createElement("div");
      studentElement.className = "student-card";
      studentElement.setAttribute("data-aos", "fade-up");
      studentElement.setAttribute("data-aos-delay", `${index * 100}`);

      // Se agrega un contenedor con scroll para el contenido de la tarjeta del estudiante
      studentElement.innerHTML = `
        <div class="student-card-header">
          <div class="student-avatar-large">
            ${this.getStudentAvatar(student.name)}
          </div>
          <div class="student-basic-info">
            <h4 class="student-name">${student.name}</h4>
            <p class="student-email">📧 ${student.email}</p>
            <p class="student-date">📅 ${new Date(
              student.created_at
            ).toLocaleDateString("es-ES")}</p>
          </div>
          <div class="performance-badge ${performanceLevel.class}">
            ${performanceLevel.icon}
            <span>${performanceLevel.text}</span>
          </div>
        </div>

        <div class="student-card-body">
          <div class="stats-row">
            <div class="stat-modern">
              <div class="stat-info">
                <span class="stat-value">${student.stats.total_games}</span>
                <span class="stat-label">Partidas</span>
              </div>
            </div>
            <div class="stat-modern">
              <div class="stat-info">
                <span class="stat-value">${uiUtils.formatScore(
                  student.stats.avg_score
                )}</span>
                <span class="stat-label">Promedio</span>
              </div>
            </div>
            <div class="stat-modern">
              <div class="stat-info">
                <span class="stat-value">${uiUtils.formatPercentage(
                  student.stats.accuracy_percentage
                )}</span>
                <span class="stat-label">Precisión</span>
              </div>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-header">
              <span>Progreso General</span>
              <span class="progress-percentage">${Math.round(
                (student.stats.avg_score / 100) * 100
              )}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(
                (student.stats.avg_score / 100) * 100,
                100
              )}%"></div>
            </div>
          </div>
        </div>

        <div class="student-card-footer">
          <button class="student-action-btn primary" onclick="showStudentDetails(${
            student.id
          })">
            👁️ Ver Detalles
          </button>
          <button class="student-action-btn secondary" onclick="exportStudentData(${
            student.id
          })">
            📊 Exportar
          </button>
        </div>
      `;
      container.appendChild(studentElement);
    });
  },

  updateStudentsOverview() {
    const students = dashboardState.students;
    const totalStudents = students.length;
    const avgScore =
      students.reduce((sum, s) => sum + s.stats.avg_score, 0) / totalStudents;
    const topStudent = students.reduce(
      (best, current) =>
        current.stats.avg_score > best.stats.avg_score ? current : best,
      students[0]
    );
    const totalGames = students.reduce(
      (sum, s) => sum + s.stats.total_games,
      0
    );

    document.getElementById("active-students-count").textContent =
      totalStudents;
    document.getElementById("students-avg-score").textContent =
      uiUtils.formatScore(avgScore);
    document.getElementById("top-student-name").textContent =
      topStudent?.name || "-";
    document.getElementById(
      "total-progress"
    ).textContent = `${totalGames} partidas`;
  },

  getPerformanceLevel(score) {
    if (score >= 85)
      return { class: "excellent", icon: "🔥", text: "Excelente" };
    if (score >= 70) return { class: "good", icon: "⭐", text: "Bueno" };
    if (score >= 60) return { class: "regular", icon: "📈", text: "Regular" };
    return { class: "needs-improvement", icon: "💪", text: "Mejorando" };
  },

  getStudentAvatar(name) {
    const avatars = ["👨‍🎓", "👩‍🎓", "🧑‍🎓", "👨‍💻", "👩‍💻", "🧑‍💻"];
    const index = name.length % avatars.length;
    return avatars[index];
  },

  updateRankingUI() {
    const rankings = dashboardState.rankings;
    const top3 = rankings.slice(0, 3);

    console.log("🎯 Actualizando UI del ranking:", {
      totalRankings: rankings.length,
      top3Count: top3.length,
      rankings: rankings,
      top3: top3,
    });

    // Actualizar podium moderno
    const positions = [
      { id: "first", index: 0 },
      { id: "second", index: 1 },
      { id: "third", index: 2 },
    ];

    positions.forEach(({ id, index }) => {
      const element = document.getElementById(`${id}-place`);
      console.log(`Looking for ${id}-place element:`, element);
      if (element) {
        if (top3[index]) {
          const student = top3[index];
          const nameElement = element.querySelector("h4");
          const scoreElement = element.querySelector(".student-score");

          if (nameElement) nameElement.textContent = student.name;
          if (scoreElement)
            scoreElement.textContent = `${uiUtils.formatScore(
              student.stats.avg_score
            )} pts`;

          // Actualizar barra de progreso
          const fillPercentage = Math.min(
            (student.stats.avg_score / 100) * 100,
            100
          );
          const achievementFill = element.querySelector(".achievement-fill");
          if (achievementFill) {
            achievementFill.style.width = `${fillPercentage}%`;
          }
        } else {
          const nameElement = element.querySelector("h4");
          const scoreElement = element.querySelector(".student-score");

          if (nameElement) nameElement.textContent = "Sin datos";
          if (scoreElement) scoreElement.textContent = "0 pts";

          // Resetear barra de progreso
          const achievementFill = element.querySelector(".achievement-fill");
          if (achievementFill) {
            achievementFill.style.width = "0%";
          }
        }
      }
    });

    // Actualizar ranking completo moderno
    const rankingContainer = document.getElementById("ranking-list");
    rankingContainer.innerHTML = "";

    if (rankings.length === 0) {
      rankingContainer.innerHTML = `
        <div class="empty-ranking">
          <div class="empty-icon">🏆</div>
          <h3>No hay datos de ranking</h3>
          <p>Los rankings aparecerán cuando los estudiantes completen partidas</p>
        </div>
      `;
      return;
    }

    rankings.forEach((student, index) => {
      const position = index + 1;
      const isTop3 = position <= 3;
      const performanceLevel = this.getPerformanceLevel(
        student.stats.avg_score
      );

      const rankingItem = document.createElement("div");
      rankingItem.className = `ranking-item ${isTop3 ? "top-performer" : ""}`;
      rankingItem.setAttribute("data-aos", "fade-left");
      rankingItem.setAttribute("data-aos-delay", `${index * 50}`);

      rankingItem.innerHTML = `
        <div class="ranking-position">
          <span class="position-number ${this.getPositionClass(
            position
          )}">${position}</span>
          ${isTop3 ? this.getPositionMedal(position) : ""}
        </div>
        
        <div class="ranking-student-info">
          <div class="student-avatar-small">${this.getStudentAvatar(
            student.name
          )}</div>
          <div class="student-details">
            <h4 class="student-name">${student.name}</h4>
            <p class="student-stats-mini">
              🎮 ${
                student.stats.total_games
              } partidas • 🎯 ${uiUtils.formatPercentage(
        student.stats.accuracy_percentage
      )}
            </p>
          </div>
        </div>

        <div class="ranking-score-section">
          <div class="score-main">
            <span class="score-value">${uiUtils.formatScore(
              student.stats.avg_score
            )}</span>
            <span class="score-label">pts</span>
          </div>
          <div class="performance-indicator ${performanceLevel.class}">
            ${performanceLevel.icon} ${performanceLevel.text}
          </div>
        </div>

        <div class="ranking-actions">
          <button class="ranking-action-btn" onclick="showStudentDetails(${
            student.id
          })" title="Ver detalles">
            👁️
          </button>
          <button class="ranking-action-btn" onclick="exportStudentData(${
            student.id
          })" title="Exportar datos">
            📊
          </button>
        </div>
      `;

      rankingContainer.appendChild(rankingItem);
    });
  },

  getPositionClass(position) {
    if (position === 1) return "first-place";
    if (position === 2) return "second-place";
    if (position === 3) return "third-place";
    return "other-place";
  },

  getPositionMedal(position) {
    const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
    return `<span class="position-medal">${medals[position]}</span>`;
  },

  updateLevelsUI() {
    const container = document.getElementById("levels-grid");
    if (!container) return;

    container.innerHTML = "";

    if (dashboardState.levels.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <h3>No hay niveles configurados</h3>
          <p>Crea niveles para que los estudiantes puedan progresar</p>
        </div>
      `;
      return;
    }

    dashboardState.levels.forEach((level, index) => {
      const levelElement = document.createElement("div");
      levelElement.className = "level-card";
      levelElement.setAttribute("data-aos", "fade-up");
      levelElement.setAttribute("data-aos-delay", `${index * 100}`);

      levelElement.innerHTML = `
        <div class="level-header">
          <h4 class="level-title">${level.title}</h4>
          <div class="level-badge">${level.badge_icon}</div>
        </div>
        
        <div class="level-info">
          <p class="level-description">${
            level.description || "Sin descripción"
          }</p>
        </div>
        
        <div class="level-stats">
          <div class="stat-item">
            <span class="stat-label">Nivel</span>
            <span class="stat-value">${level.level_number}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Experiencia</span>
            <span class="stat-value">${level.experience_required}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Puntos</span>
            <span class="stat-value">${level.rewards_points}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Color</span>
            <span class="stat-value" style="color: ${
              level.badge_color
            }">●</span>
          </div>
        </div>
        
        <div class="level-actions">
          <button class="action-btn edit-btn" onclick="editLevel(${
            level.level_number
          })">
            ✏️ Editar
          </button>
          <button class="action-btn delete-btn" onclick="deleteLevel(${
            level.level_number
          })">
            🗑️ Eliminar
          </button>
        </div>
      `;

      container.appendChild(levelElement);
    });
  },

  updateAchievementsUI() {
    const container = document.getElementById("achievements-grid");
    if (!container) return;

    container.innerHTML = "";

    if (dashboardState.achievements.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <h3>No hay logros configurados</h3>
          <p>Crea logros para motivar a los estudiantes</p>
        </div>
      `;
      return;
    }

    dashboardState.achievements.forEach((achievement, index) => {
      const achievementElement = document.createElement("div");
      achievementElement.className = "achievement-card";
      achievementElement.setAttribute("data-aos", "fade-up");
      achievementElement.setAttribute("data-aos-delay", `${index * 100}`);

      const statusClass = achievement.is_active ? "active" : "inactive";
      const statusText = achievement.is_active ? "Activo" : "Inactivo";

      achievementElement.innerHTML = `
        <div class="achievement-header">
          <h4 class="achievement-title">${achievement.name}</h4>
          <div class="achievement-badge">${achievement.icon}</div>
        </div>
        
        <div class="achievement-info">
          <p class="achievement-description">${
            achievement.description || "Sin descripción"
          }</p>
        </div>
        
        <div class="achievement-stats">
          <div class="stat-item">
            <span class="stat-label">Tipo</span>
            <span class="stat-value">${this.getCriteriaTypeText(
              achievement.criteria_type
            )}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Valor</span>
            <span class="stat-value">${achievement.criteria_value}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Puntos</span>
            <span class="stat-value">${achievement.points_reward}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Estado</span>
            <span class="stat-value ${statusClass}">${statusText}</span>
          </div>
        </div>
        
        <div class="achievement-actions">
          <button class="action-btn edit-btn" onclick="editAchievement(${
            achievement.id
          })">
            ✏️ Editar
          </button>
          <button class="action-btn delete-btn" onclick="deleteAchievement(${
            achievement.id
          })">
            🗑️ Eliminar
          </button>
        </div>
      `;

      container.appendChild(achievementElement);
    });
  },

  updateRewardsUI() {
    const container = document.getElementById("rewards-grid");
    if (!container) return;

    container.innerHTML = "";

    if (!dashboardState.rewards || dashboardState.rewards.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎁</div>
          <h3>No hay premios configurados</h3>
          <p>Crea premios para motivar a los estudiantes</p>
        </div>
      `;
      return;
    }

    dashboardState.rewards.forEach((reward) => {
      const statusClass = reward.is_active ? "active" : "inactive";
      const statusText = reward.is_active ? "Activo" : "Inactivo";
      const typeText = this.getRewardTypeText(reward.reward_type);

      const rewardElement = document.createElement("div");
      rewardElement.className = "reward-card";
      rewardElement.innerHTML = `
        <div class="reward-header">
          <div class="reward-icon">🎁</div>
          <div class="reward-info">
            <h4>${reward.name}</h4>
            <p>${reward.description || 'Sin descripción'}</p>
          </div>
        </div>
        
        <div class="reward-stats">
          <div class="stat-item">
            <span class="stat-label">Tipo</span>
            <span class="stat-value">${typeText}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Valor</span>
            <span class="stat-value">${reward.reward_value}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Puntos Requeridos</span>
            <span class="stat-value">${reward.points_required}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Estado</span>
            <span class="stat-value ${statusClass}">${statusText}</span>
          </div>
        </div>
        
        <div class="reward-actions">
          <button class="action-btn edit-btn" onclick="editReward(${reward.id})">
            ✏️ Editar
          </button>
          <button class="action-btn delete-btn" onclick="deleteReward(${reward.id})">
            🗑️ Eliminar
          </button>
        </div>
      `;

      container.appendChild(rewardElement);
    });
  },

  getRewardTypeText(type) {
    const types = {
      'points': 'Puntos',
      'badge': 'Insignia',
      'certificate': 'Certificado',
      'privilege': 'Privilegio',
      'physical': 'Físico'
    };
    return types[type] || type;
  },

  updateLevelsStatsUI() {
    const stats = dashboardState.levelsStats;

    document.getElementById("total-levels").textContent =
      dashboardState.levels.length;
    document.getElementById("active-achievements").textContent =
      stats.active_achievements || 0;
    document.getElementById("total-rewards").textContent =
      dashboardState.rewards?.length || 0;
    document.getElementById("avg-student-level").textContent = "N/A"; // Se puede calcular después
  },

  updateAnalyticsUI() {
    const analytics = dashboardState.analytics;
    if (!analytics) return;

    // Actualizar gráfico de tendencia temporal
    this.createTemporalTrendChart(analytics.temporal_trend);

    // Actualizar gráfico de análisis de dificultad
    this.createDifficultyAnalysisChart(analytics.difficulty_analysis);

    // Actualizar métricas detalladas
    this.updatePerformanceStats(analytics.performance_stats);
    this.updateTimeAnalysis(analytics.time_analysis);
  },

  createTemporalTrendChart(trendData) {
    const ctx = document.getElementById("temporal-trend-chart");
    if (!ctx) return;

    // Destruir gráfico existente si existe
    if (dashboardState.charts.temporalTrend) {
      dashboardState.charts.temporalTrend.destroy();
    }

    const labels = trendData.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      });
    });

    const data = trendData.map((item) => item.value);

    dashboardState.charts.temporalTrend = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tendencia Temporal",
            data: data,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#4CAF50",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#fff" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
          },
          y: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
            beginAtZero: true,
          },
        },
      },
    });
  },

  createDifficultyAnalysisChart(difficultyData) {
    const ctx = document.getElementById("difficulty-analysis-chart");
    if (!ctx) return;

    // Destruir gráfico existente si existe
    if (dashboardState.charts.difficultyAnalysis) {
      dashboardState.charts.difficultyAnalysis.destroy();
    }

    const labels = difficultyData.map((item) => item.difficulty_level);
    const data = difficultyData.map((item) => item.count);
    const colors = [
      "#4CAF50", // Excelente
      "#8BC34A", // Muy Bueno
      "#FFC107", // Bueno
      "#FF9800", // Regular
      "#F44336", // Aceptable
      "#9C27B0", // Necesita Mejora
    ];

    dashboardState.charts.difficultyAnalysis = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Cantidad de Partidas",
            data: data,
            backgroundColor: colors.slice(0, data.length),
            borderColor: colors
              .slice(0, data.length)
              .map((color) => color + "80"),
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#fff" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
          },
          y: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
            beginAtZero: true,
          },
        },
      },
    });
  },

  updatePerformanceStats(stats) {
    const container = document.getElementById("performance-stats");
    if (!container) return;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Estudiantes Activos</span>
          <span class="stat-value">${uiUtils.formatNumber(
            stats.active_students || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Partidas</span>
          <span class="stat-value">${uiUtils.formatNumber(
            stats.total_games || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Puntuación Promedio</span>
          <span class="stat-value">${uiUtils.formatScore(
            stats.avg_score || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Precisión Promedio</span>
          <span class="stat-value">${uiUtils.formatPercentage(
            stats.avg_accuracy || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Puntuación Mínima</span>
          <span class="stat-value">${uiUtils.formatScore(
            stats.min_score || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Puntuación Máxima</span>
          <span class="stat-value">${uiUtils.formatScore(
            stats.max_score || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Preguntas Correctas</span>
          <span class="stat-value">${uiUtils.formatNumber(
            stats.total_correct || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Preguntas</span>
          <span class="stat-value">${uiUtils.formatNumber(
            stats.total_questions || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Percentil 25</span>
          <span class="stat-value">${uiUtils.formatScore(
            stats.percentiles?.q25 || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Percentil 50 (Mediana)</span>
          <span class="stat-value">${uiUtils.formatScore(
            stats.percentiles?.q50 || 0
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Percentil 75</span>
          <span class="stat-value">${uiUtils.formatScore(
            stats.percentiles?.q75 || 0
          )}</span>
        </div>
      </div>
    `;
  },

  updateTimeAnalysis(timeData) {
    const container = document.getElementById("time-analysis");
    if (!container) return;

    const timeStats = timeData.time_stats;
    const hourlyAnalysis = timeData.hourly_analysis;
    const dailyAnalysis = timeData.daily_analysis;

    container.innerHTML = `
      <div class="time-stats-grid">
        <div class="time-stat-item">
          <span class="stat-label">Duración Promedio</span>
          <span class="stat-value">${Math.round(
            timeStats.avg_duration_minutes || 0
          )} min</span>
        </div>
        <div class="time-stat-item">
          <span class="stat-label">Duración Mínima</span>
          <span class="stat-value">${Math.round(
            timeStats.min_duration_minutes || 0
          )} min</span>
        </div>
        <div class="time-stat-item">
          <span class="stat-label">Duración Máxima</span>
          <span class="stat-value">${Math.round(
            timeStats.max_duration_minutes || 0
          )} min</span>
        </div>
        <div class="time-stat-item">
          <span class="stat-label">Partidas con Tiempo</span>
          <span class="stat-value">${uiUtils.formatNumber(
            timeStats.total_games_with_time || 0
          )}</span>
        </div>
      </div>
      
      <div class="time-analysis-section">
        <h5>📊 Análisis por Hora del Día</h5>
        <div class="hourly-chart-container">
          <canvas id="hourly-analysis-chart"></canvas>
        </div>
      </div>
      
      <div class="time-analysis-section">
        <h5>📅 Análisis por Día de la Semana</h5>
        <div class="daily-chart-container">
          <canvas id="daily-analysis-chart"></canvas>
        </div>
      </div>
    `;

    // Crear gráficos de tiempo
    this.createHourlyAnalysisChart(hourlyAnalysis);
    this.createDailyAnalysisChart(dailyAnalysis);
  },

  createHourlyAnalysisChart(hourlyData) {
    const ctx = document.getElementById("hourly-analysis-chart");
    if (!ctx) return;

    const labels = hourlyData.map((item) => `${item.hour}:00`);
    const scores = hourlyData.map((item) => item.avg_score);
    const durations = hourlyData.map((item) => item.avg_duration);

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Puntuación Promedio",
            data: scores,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            yAxisID: "y",
          },
          {
            label: "Duración Promedio (min)",
            data: durations,
            borderColor: "#FF9800",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#fff" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
            beginAtZero: true,
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            ticks: { color: "#fff" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  },

  createDailyAnalysisChart(dailyData) {
    const ctx = document.getElementById("daily-analysis-chart");
    if (!ctx) return;

    const labels = dailyData.map((item) => item.day_name);
    const scores = dailyData.map((item) => item.avg_score);
    const accuracies = dailyData.map((item) => item.avg_accuracy);

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Puntuación Promedio",
            data: scores,
            backgroundColor: "rgba(76, 175, 80, 0.8)",
            borderColor: "#4CAF50",
            borderWidth: 2,
          },
          {
            label: "Precisión Promedio",
            data: accuracies,
            backgroundColor: "rgba(33, 150, 243, 0.8)",
            borderColor: "#2196F3",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#fff" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
          },
          y: {
            ticks: { color: "#fff" },
            grid: { color: "rgba(255, 255, 255, 0.2)" },
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  },

  getCriteriaTypeText(type) {
    const types = {
      games_played: "Partidas Jugadas",
      score_reached: "Puntuación Alcanzada",
      streak_days: "Racha de Días",
      accuracy_percentage: "Porcentaje de Precisión",
      total_points: "Puntos Totales",
      level_reached: "Nivel Alcanzado",
    };
    return types[type] || type;
  },

  createOverviewCharts() {
    // Preparar datos de progreso semanal
    const weeklyData = dashboardState.chartData?.weeklyProgress || [];
    const last7Days = this.getLast7Days();
    const weeklyScores = last7Days.map((day) => {
      const dayData = weeklyData.find((d) => d.date === day.date);
      return dayData ? dayData.avg_score : 0;
    });

    // Gráfico de progreso semanal con datos reales
    const weeklyCtx = document.getElementById("weekly-progress-chart");
    if (weeklyCtx) {
      // Destruir gráfico existente si existe
      if (dashboardState.charts.weekly) {
        dashboardState.charts.weekly.destroy();
      }

      dashboardState.charts.weekly = new Chart(weeklyCtx, {
        type: "line",
        data: {
          labels: last7Days.map((day) => day.label),
          datasets: [
            {
              label: "Promedio Diario",
              data: weeklyScores,
              borderColor: "#00b4d8",
              backgroundColor: "rgba(0, 180, 216, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: "#fff" },
            },
          },
          scales: {
            x: {
              ticks: { color: "#fff" },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
            y: {
              ticks: { color: "#fff" },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
              beginAtZero: true,
              max: 100,
            },
          },
        },
      });
    }

    // Preparar datos de distribución de puntuaciones
    const distribution = dashboardState.chartData?.scoreDistribution || {};
    const distributionData = [
      distribution.excellent || 0,
      distribution.good || 0,
      distribution.regular || 0,
      distribution.needs_improvement || 0,
    ];

    // Gráfico de distribución de puntuaciones con datos reales
    const scoreCtx = document.getElementById("score-distribution-chart");
    if (scoreCtx) {
      // Destruir gráfico existente si existe
      if (dashboardState.charts.distribution) {
        dashboardState.charts.distribution.destroy();
      }

      dashboardState.charts.distribution = new Chart(scoreCtx, {
        type: "doughnut",
        data: {
          labels: [
            "Excelente (90-100)",
            "Bueno (70-89)",
            "Regular (50-69)",
            "Necesita mejorar (<50)",
          ],
          datasets: [
            {
              data: distributionData,
              backgroundColor: ["#10b981", "#00b4d8", "#f2b84b", "#ef4444"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#fff",
                padding: 15,
                usePointStyle: true,
              },
            },
          },
        },
      });
    }
  },

  // Función auxiliar para obtener los últimos 7 días
  getLast7Days() {
    const days = [];
    const today = new Date();
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({
        date: date.toISOString().split("T")[0], // formato YYYY-MM-DD
        label: dayNames[date.getDay()],
      });
    }

    return days;
  },
};

// Gestión de modales
const modalManager = {
  show(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error('Modal no encontrado:', modalId);
      return;
    }
    modal.classList.add("active");
  },

  hide(modalId) {
    document.getElementById(modalId).classList.remove("active");
  },

  setupEventListeners() {
    // Cerrar modales con el botón X
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        modal.classList.remove("active");
      });
    });

    // Cerrar modales clickeando fuera
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
        }
      });
    });
  },
};

// Funciones globales para eventos
window.showStudentDetails = async function (studentId) {
  try {
    uiUtils.showLoading();
    const studentData = await dataManager.loadStudentDetails(studentId);

    const modalBody = document.getElementById("student-modal-body");
    modalBody.innerHTML = `
      <div class="student-details">
        <div class="detail-section">
          <h4>📝 Información Personal</h4>
          <p><strong>Nombre:</strong> ${studentData.student.name}</p>
          <p><strong>Email:</strong> ${studentData.student.email}</p>
          <p><strong>Registrado:</strong> ${new Date(
            studentData.student.created_at
          ).toLocaleDateString("es-ES")}</p>
        </div>
        
        <div class="detail-section">
          <h4>📊 Estadísticas Generales</h4>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-content">
                <h5>Total de Partidas</h5>
                <p class="stat-number">${studentData.stats.total_games}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <h5>Puntuación Promedio</h5>
                <p class="stat-number">${uiUtils.formatScore(
                  studentData.stats.avg_score
                )}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <h5>Mejor Puntuación</h5>
                <p class="stat-number">${studentData.stats.best_score}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-content">
                <h5>Precisión</h5>
                <p class="stat-number">${uiUtils.formatPercentage(
                  studentData.stats.accuracy_percentage
                )}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>🎮 Partidas Recientes</h4>
          <div class="recent-games">
            ${studentData.recent_games
              .map(
                (game) => `
              <div class="game-item">
                <div class="game-info">
                  <strong>Puntuación: ${game.score}</strong>
                  <span>Preguntas: ${game.correct_answers}/${
                  game.total_questions
                }</span>
                  <span>Fecha: ${new Date(game.played_at).toLocaleDateString(
                    "es-ES"
                  )}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById(
      "student-modal-title"
    ).textContent = `Detalles de ${studentData.student.name}`;

    modalManager.show("student-modal");
  } catch (error) {
    console.error("Error mostrando detalles del estudiante:", error);
    alert("Error al cargar los detalles del estudiante");
  } finally {
    uiUtils.hideLoading();
  }
};

// Funciones de exportación
window.exportStudentData = async function (studentId) {
  try {
    uiUtils.showLoading();
    
    // Obtener datos del estudiante desde el backend
    const response = await apiUtils.makeRequest(`/dashboard/export/${studentId}`);
    
    if (response.success) {
      // Mostrar modal de opciones de exportación
      showExportModal(response.data, 'student');
    } else {
      alert('Error al obtener los datos del estudiante');
    }
  } catch (error) {
    console.error('Error exportando datos del estudiante:', error);
    alert('Error al exportar los datos del estudiante');
  } finally {
    uiUtils.hideLoading();
  }
};

window.exportAllStudents = async function () {
  try {
    uiUtils.showLoading();
    
    // Obtener datos de todos los estudiantes desde el backend
    const response = await apiUtils.makeRequest('/dashboard/export');
    
    if (response.success) {
      // Mostrar modal de opciones de exportación
      showExportModal(response.data, 'all');
    } else {
      alert('Error al obtener los datos de los estudiantes');
    }
  } catch (error) {
    console.error('Error exportando datos de estudiantes:', error);
    alert('Error al exportar los datos de los estudiantes');
  } finally {
    uiUtils.hideLoading();
  }
};

function showExportModal(data, type) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'export-modal';
  
  const title = type === 'student' ? 
    `Exportar datos de ${data.student_info.name}` : 
    `Exportar datos de ${data.total_count} estudiantes`;
  
  modal.innerHTML = `
    <div class="modal-content export-modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="closeExportModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="export-options">
          <h4>Selecciona el formato de exportación:</h4>
          <div class="export-buttons">
            <button class="export-format-btn csv-btn" onclick="exportToCSV('${type}')">
              📊 Exportar como CSV
              <small>Ideal para análisis en Excel</small>
            </button>
            <button class="export-format-btn pdf-btn" onclick="exportToPDF('${type}')">
              📄 Exportar como PDF
              <small>Ideal para reportes</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Guardar datos en variable global temporal
  window.exportData = data;
  window.exportType = type;
}

function closeExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) {
    modal.remove();
  }
  delete window.exportData;
  delete window.exportType;
}

window.exportToCSV = function(type) {
  const data = window.exportData;
  let csvContent = '';
  let filename = '';
  
  if (type === 'student') {
    // Exportar datos de un estudiante
    const student = data.student_info;
    const stats = data.summary_stats;
    const games = data.all_games;
    
    filename = `estudiante_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Información del estudiante
    csvContent += 'INFORMACIÓN DEL ESTUDIANTE\n';
    csvContent += `Nombre,${student.name}\n`;
    csvContent += `Email,${student.email}\n`;
    csvContent += `Fecha de registro,${new Date(student.created_at).toLocaleDateString('es-ES')}\n`;
    csvContent += `Fecha de exportación,${new Date(data.export_date).toLocaleDateString('es-ES')}\n\n`;
    
    // Estadísticas generales
    csvContent += 'ESTADÍSTICAS GENERALES\n';
    csvContent += `Total de partidas,${stats.total_games}\n`;
    csvContent += `Puntuación promedio,${stats.avg_score}\n`;
    csvContent += `Mejor puntuación,${stats.best_score}\n`;
    csvContent += `Precisión promedio,${stats.accuracy_percentage}%\n`;
    csvContent += `Tiempo total jugado,${Math.round(stats.total_time_played / 60)} minutos\n\n`;
    
    // Historial de partidas
    csvContent += 'HISTORIAL DE PARTIDAS\n';
    csvContent += 'Fecha,Puntuación,Respuestas Correctas,Respuestas Incorrectas,Precisión,Duración (min)\n';
    
    games.forEach(game => {
      const duration = Math.round(game.duration / 60);
      const accuracy = game.total_questions > 0 ? ((game.correct_answers / game.total_questions) * 100).toFixed(1) : 0;
      csvContent += `${new Date(game.played_at).toLocaleDateString('es-ES')},${game.score},${game.correct_answers},${game.wrong_answers},${accuracy}%,${duration}\n`;
    });
    
  } else {
    // Exportar datos de todos los estudiantes
    filename = `todos_estudiantes_${new Date().toISOString().split('T')[0]}.csv`;
    
    csvContent += 'REPORTE DE TODOS LOS ESTUDIANTES\n';
    csvContent += `Total de estudiantes,${data.total_count}\n`;
    csvContent += `Fecha de exportación,${new Date(data.export_date).toLocaleDateString('es-ES')}\n\n`;
    
    // Encabezados
    csvContent += 'Nombre,Email,Fecha de registro,Total partidas,Puntuación promedio,Mejor puntuación,Precisión promedio,Tiempo total (min)\n';
    
    // Datos de estudiantes
    data.students.forEach(student => {
      const totalTime = Math.round((student.stats?.total_time_played || student.total_time_played || 0) / 60);
      const stats = student.stats || student;
      csvContent += `${student.name},${student.email},${new Date(student.created_at).toLocaleDateString('es-ES')},${stats.total_games},${stats.avg_score},${stats.best_score || 0},${stats.accuracy_percentage}%,${totalTime}\n`;
    });
  }
  
  // Descargar archivo CSV
  downloadFile(csvContent, filename, 'text/csv');
  closeExportModal();
};

window.exportToPDF = function(type) {
  const data = window.exportData;
  
  // Para PDF, vamos a crear un HTML que se puede imprimir
  let htmlContent = '';
  let filename = '';
  
  if (type === 'student') {
    const student = data.student_info;
    const stats = data.summary_stats;
    const games = data.all_games;
    
    filename = `estudiante_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de ${student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .info-item { background: #f8fafc; padding: 10px; border-radius: 5px; }
          .info-label { font-weight: bold; color: #374151; }
          .info-value { color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .stats-highlight { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🦈 Shark Learns - Reporte de Estudiante</h1>
          <h2>${student.name}</h2>
          <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="section">
          <h3>📝 Información Personal</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nombre:</div>
              <div class="info-value">${student.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email:</div>
              <div class="info-value">${student.email}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de registro:</div>
              <div class="info-value">${new Date(student.created_at).toLocaleDateString('es-ES')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ID de usuario:</div>
              <div class="info-value">${student.id}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>📊 Estadísticas Generales</h3>
          <div class="stats-highlight">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Total de partidas:</div>
                <div class="info-value">${stats.total_games}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Puntuación promedio:</div>
                <div class="info-value">${stats.avg_score} puntos</div>
              </div>
              <div class="info-item">
                <div class="info-label">Mejor puntuación:</div>
                <div class="info-value">${stats.best_score || 0} puntos</div>
              </div>
              <div class="info-item">
                <div class="info-label">Precisión promedio:</div>
                <div class="info-value">${stats.accuracy_percentage}%</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tiempo total jugado:</div>
                <div class="info-value">${Math.round(stats.total_time_played / 60)} minutos</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>🎮 Historial de Partidas (Últimas ${Math.min(games.length, 20)})</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Puntuación</th>
                <th>Correctas</th>
                <th>Incorrectas</th>
                <th>Precisión</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    games.slice(0, 20).forEach(game => {
      const duration = Math.round(game.duration / 60);
      const accuracy = game.total_questions > 0 ? ((game.correct_answers / game.total_questions) * 100).toFixed(1) : 0;
      htmlContent += `
              <tr>
                <td>${new Date(game.played_at).toLocaleDateString('es-ES')}</td>
                <td>${game.score}</td>
                <td>${game.correct_answers}</td>
                <td>${game.wrong_answers}</td>
                <td>${accuracy}%</td>
                <td>${duration} min</td>
              </tr>
      `;
    });
    
    htmlContent += `
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Reporte generado por Shark Learns Dashboard</p>
          <p>Fecha de exportación: ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;
    
  } else {
    filename = `todos_estudiantes_${new Date().toISOString().split('T')[0]}.pdf`;
    
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Todos los Estudiantes</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🦈 Shark Learns - Reporte General</h1>
          <h2>Todos los Estudiantes</h2>
          <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="section">
          <h3>📊 Resumen General</h3>
          <div class="summary">
            <p><strong>Total de estudiantes:</strong> ${data.total_count}</p>
            <p><strong>Fecha de exportación:</strong> ${new Date(data.export_date).toLocaleDateString('es-ES')}</p>
          </div>
        </div>
        
        <div class="section">
          <h3>👥 Lista de Estudiantes</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Registro</th>
                <th>Partidas</th>
                <th>Promedio</th>
                <th>Mejor</th>
                <th>Precisión</th>
                <th>Tiempo (min)</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    data.students.forEach(student => {
      const totalTime = Math.round((student.stats?.total_time_played || student.total_time_played || 0) / 60);
      const stats = student.stats || student;
      htmlContent += `
              <tr>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${new Date(student.created_at).toLocaleDateString('es-ES')}</td>
                <td>${stats.total_games}</td>
                <td>${stats.avg_score}</td>
                <td>${stats.best_score || 0}</td>
                <td>${stats.accuracy_percentage}%</td>
                <td>${totalTime}</td>
              </tr>
      `;
    });
    
    htmlContent += `
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Reporte generado por Shark Learns Dashboard</p>
          <p>Fecha de exportación: ${new Date().toLocaleString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;
  }
  
  // Abrir en nueva ventana para imprimir como PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Esperar a que se cargue y luego mostrar diálogo de impresión
  printWindow.onload = function() {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  closeExportModal();
};

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Filtro de búsqueda de estudiantes
function setupStudentSearch() {
  const searchInput = document.getElementById("student-search");
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const studentItems = document.querySelectorAll(".student-item");

    studentItems.forEach((item) => {
      const studentName = item.querySelector("h4").textContent.toLowerCase();
      const studentEmail = item.querySelector("p").textContent.toLowerCase();

      if (
        studentName.includes(searchTerm) ||
        studentEmail.includes(searchTerm)
      ) {
        item.style.display = "grid";
      } else {
        item.style.display = "none";
      }
    });
  });
}

// Inicialización del dashboard
async function initDashboard() {
  try {
    uiUtils.showLoading();

    // Verificar autenticación
    const isAuthenticated = await authManager.verifyAuth();
    if (!isAuthenticated) return;

    // Configurar event listeners
    setupEventListeners();
    setupLevelsEventListeners();
    modalManager.setupEventListeners();
    setupStudentSearch();

    // Cargar datos iniciales
    await Promise.all([
      dataManager.loadSystemStats(),
      dataManager.loadStudents(),
      dataManager.loadRanking(),
      dataManager.loadLevelsStats(),
      dataManager.loadLevels(),
      dataManager.loadAchievements(),
      dataManager.loadRewards(),
      dataManager.loadAnalytics(),
    ]);
  } catch (error) {
    console.error("Error inicializando dashboard:", error);
    alert("Error al cargar el dashboard");
  } finally {
    uiUtils.hideLoading();
  }
}

// Event listeners principales
function setupEventListeners() {
  // Navegación del dashboard
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      uiUtils.showSection(section);

      // Cargar datos específicos de la sección si es necesario
      if (section === "students" && dashboardState.students.length === 0) {
        dataManager.loadStudents();
      } else if (
        section === "ranking" &&
        dashboardState.rankings.length === 0
      ) {
        dataManager.loadRanking();
      } else if (section === "levels") {
        dataManager.loadLevelsStats();
      } else if (section === "analytics") {
        dataManager.loadAnalytics();
      }
    });
  });

  // Botón de logout
  document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      authManager.logout();
    }
  });

  // Botones de refresh
  document.getElementById("refresh-overview").addEventListener("click", () => {
    dataManager.loadSystemStats();
  });

  document.getElementById("refresh-students").addEventListener("click", () => {
    dataManager.loadStudents();
  });

  document.getElementById("refresh-ranking").addEventListener("click", () => {
    dataManager.loadRanking();
  });

  document.getElementById("refresh-levels").addEventListener("click", () => {
    dataManager.loadLevelsStats();
  });

  // Botón de exportar todos los estudiantes
  document.getElementById("export-all-students").addEventListener("click", () => {
    exportAllStudents();
  });

  document.getElementById("refresh-analytics").addEventListener("click", () => {
    const period = document.getElementById("analytics-period").value;
    const metric = document.getElementById("analytics-metric").value;
    dataManager.loadAnalytics(period, metric);
  });

  // Event listeners para filtros de analíticas
  document.getElementById("analytics-period").addEventListener("change", () => {
    const period = document.getElementById("analytics-period").value;
    const metric = document.getElementById("analytics-metric").value;
    dataManager.loadAnalytics(period, metric);
  });

  document.getElementById("analytics-metric").addEventListener("change", () => {
    const period = document.getElementById("analytics-period").value;
    const metric = document.getElementById("analytics-metric").value;
    dataManager.loadAnalytics(period, metric);
  });

  // Event listeners para pestañas de niveles
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      // Remover active de todas las pestañas
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      // Activar pestaña seleccionada
      btn.classList.add("active");
      document.getElementById(`${tab}-content`).classList.add("active");

      // Cargar datos específicos de la pestaña
      if (tab === "levels") {
        dataManager.loadLevels();
      } else if (tab === "achievements") {
        dataManager.loadAchievements();
      } else if (tab === "rewards") {
        dataManager.loadRewards();
      }
    });
  });
}

// ===== GESTIÓN DE NIVELES Y LOGROS =====

// Funciones globales para niveles
window.createLevel = async function() {
  modalManager.show('level-modal');
  document.getElementById('level-form').reset();
  document.getElementById('level-modal-title').textContent = 'Crear Nuevo Nivel';
  document.getElementById('level-id').value = '';
};

window.editLevel = async function(levelNumber) {
  const level = dashboardState.levels.find(l => l.level_number === levelNumber);
  if (!level) return;
  
  modalManager.show('level-modal');
  document.getElementById('level-modal-title').textContent = 'Editar Nivel';
  document.getElementById('level-id').value = level.level_number;
  document.getElementById('level-number').value = level.level_number;
  document.getElementById('level-title').value = level.title;
  document.getElementById('level-description').value = level.description || '';
  document.getElementById('level-experience').value = level.experience_required;
  document.getElementById('level-points').value = level.rewards_points;
  document.getElementById('level-icon').value = level.badge_icon;
  document.getElementById('level-color').value = level.badge_color;
};

window.deleteLevel = async function(levelNumber) {
  if (!confirm('¿Estás seguro de que deseas eliminar este nivel?')) return;
  
  try {
    uiUtils.showLoading();
    await apiUtils.makeRequest(`/levels/${levelNumber}`, {
      method: 'DELETE'
    });
    
    await dataManager.loadLevels();
    await dataManager.loadLevelsStats();
    alert('Nivel eliminado exitosamente');
  } catch (error) {
    console.error('Error eliminando nivel:', error);
    alert('Error al eliminar el nivel');
  } finally {
    uiUtils.hideLoading();
  }
};

// Funciones globales para logros
window.createAchievement = async function() {
  modalManager.show('achievement-modal');
  document.getElementById('achievement-form').reset();
  document.getElementById('achievement-modal-title').textContent = 'Crear Nuevo Logro';
  document.getElementById('achievement-id').value = '';
};

window.editAchievement = async function(achievementId) {
  const achievement = dashboardState.achievements.find(a => a.id === achievementId);
  if (!achievement) return;
  
  modalManager.show('achievement-modal');
  document.getElementById('achievement-modal-title').textContent = 'Editar Logro';
  document.getElementById('achievement-id').value = achievement.id;
  document.getElementById('achievement-name').value = achievement.name;
  document.getElementById('achievement-description').value = achievement.description || '';
  document.getElementById('achievement-icon').value = achievement.icon;
  document.getElementById('achievement-criteria-type').value = achievement.criteria_type;
  document.getElementById('achievement-criteria-value').value = achievement.criteria_value;
  document.getElementById('achievement-points').value = achievement.points_reward;
  document.getElementById('achievement-color').value = achievement.badge_color;
  document.getElementById('achievement-active').checked = achievement.is_active;
};

window.deleteAchievement = async function(achievementId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este logro?')) return;
  
  try {
    uiUtils.showLoading();
    await apiUtils.makeRequest(`/levels/achievements/${achievementId}`, {
      method: 'DELETE'
    });
    
    await dataManager.loadAchievements();
    await dataManager.loadLevelsStats();
    alert('Logro eliminado exitosamente');
  } catch (error) {
    console.error('Error eliminando logro:', error);
    alert('Error al eliminar el logro');
  } finally {
    uiUtils.hideLoading();
  }
};

// Funciones para manejar formularios
window.saveLevelForm = async function(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const levelData = {
    level_number: parseInt(formData.get('level_number')),
    title: formData.get('title'),
    description: formData.get('description'),
    experience_required: parseInt(formData.get('experience_required')),
    rewards_points: parseInt(formData.get('rewards_points')),
    badge_icon: formData.get('badge_icon'),
    badge_color: formData.get('badge_color')
  };
  
  const levelId = formData.get('level_id');
  const isEdit = levelId && levelId !== '';
  
  try {
    uiUtils.showLoading();
    
    if (isEdit) {
      await apiUtils.makeRequest(`/levels/${levelId}`, {
        method: 'PUT',
        body: JSON.stringify(levelData)
      });
    } else {
      await apiUtils.makeRequest('/levels', {
        method: 'POST',
        body: JSON.stringify(levelData)
      });
    }
    
    modalManager.hide('level-modal');
    await dataManager.loadLevels();
    await dataManager.loadLevelsStats();
    alert(isEdit ? 'Nivel actualizado exitosamente' : 'Nivel creado exitosamente');
  } catch (error) {
    console.error('Error guardando nivel:', error);
    alert('Error al guardar el nivel');
  } finally {
    uiUtils.hideLoading();
  }
};

window.saveAchievementForm = async function(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const achievementData = {
    name: formData.get('name'),
    description: formData.get('description'),
    icon: formData.get('icon'),
    criteria_type: formData.get('criteria_type'),
    criteria_value: parseInt(formData.get('criteria_value')),
    points_reward: parseInt(formData.get('points_reward')),
    badge_color: formData.get('badge_color'),
    is_active: formData.get('is_active') === 'on'
  };
  
  const achievementId = formData.get('achievement_id');
  const isEdit = achievementId && achievementId !== '';
  
  try {
    uiUtils.showLoading();
    
    if (isEdit) {
      await apiUtils.makeRequest(`/levels/achievements/${achievementId}`, {
        method: 'PUT',
        body: JSON.stringify(achievementData)
      });
    } else {
      await apiUtils.makeRequest('/levels/achievements', {
        method: 'POST',
        body: JSON.stringify(achievementData)
      });
    }
    
    modalManager.hide('achievement-modal');
    await dataManager.loadAchievements();
    await dataManager.loadLevelsStats();
    alert(isEdit ? 'Logro actualizado exitosamente' : 'Logro creado exitosamente');
  } catch (error) {
    console.error('Error guardando logro:', error);
    alert('Error al guardar el logro');
  } finally {
    uiUtils.hideLoading();
  }
};

// Funciones globales para premios
window.createReward = async function() {
  modalManager.show('reward-modal');
  document.getElementById('reward-form').reset();
  document.getElementById('reward-modal-title').textContent = 'Crear Nuevo Premio';
  document.getElementById('reward-id').value = '';
};

window.editReward = async function(rewardId) {
  const reward = dashboardState.rewards.find(r => r.id === rewardId);
  if (!reward) return;
  
  modalManager.show('reward-modal');
  document.getElementById('reward-modal-title').textContent = 'Editar Premio';
  document.getElementById('reward-id').value = reward.id;
  document.getElementById('reward-name').value = reward.name;
  document.getElementById('reward-description').value = reward.description || '';
  document.getElementById('reward-type').value = reward.reward_type;
  document.getElementById('reward-value').value = reward.reward_value;
  document.getElementById('reward-points').value = reward.points_required;
  document.getElementById('reward-active').checked = reward.is_active;
};

window.deleteReward = async function(rewardId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este premio?')) return;
  
  try {
    uiUtils.showLoading();
    await apiUtils.makeRequest(`/levels/rewards/${rewardId}`, {
      method: 'DELETE'
    });
    
    await dataManager.loadRewards();
    await dataManager.loadLevelsStats();
    alert('Premio eliminado exitosamente');
  } catch (error) {
    console.error('Error eliminando premio:', error);
    alert('Error al eliminar el premio');
  } finally {
    uiUtils.hideLoading();
  }
};

window.saveRewardForm = async function(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const rewardData = {
    name: formData.get('name'),
    description: formData.get('description'),
    reward_type: formData.get('reward_type'),
    reward_value: formData.get('reward_value'),
    points_required: parseInt(formData.get('points_required')),
    is_active: formData.get('is_active') === 'on'
  };
  
  const rewardId = formData.get('reward_id');
  const isEdit = rewardId && rewardId !== '';
  
  try {
    uiUtils.showLoading();
    
    if (isEdit) {
      await apiUtils.makeRequest(`/levels/rewards/${rewardId}`, {
        method: 'PUT',
        body: JSON.stringify(rewardData)
      });
    } else {
      await apiUtils.makeRequest('/levels/rewards', {
        method: 'POST',
        body: JSON.stringify(rewardData)
      });
    }
    
    modalManager.hide('reward-modal');
    await dataManager.loadRewards();
    await dataManager.loadLevelsStats();
    alert(isEdit ? 'Premio actualizado exitosamente' : 'Premio creado exitosamente');
  } catch (error) {
    console.error('Error guardando premio:', error);
    alert('Error al guardar el premio');
  } finally {
    uiUtils.hideLoading();
  }
};

// Configurar event listeners para niveles y logros
function setupLevelsEventListeners() {
  // Botones para agregar
  document.getElementById('add-level-btn')?.addEventListener('click', createLevel);
  document.getElementById('add-achievement-btn')?.addEventListener('click', createAchievement);
  document.getElementById('add-reward-btn')?.addEventListener('click', createReward);
  
  // Formularios
  document.getElementById('level-form')?.addEventListener('submit', saveLevelForm);
  document.getElementById('achievement-form')?.addEventListener('submit', saveAchievementForm);
  document.getElementById('reward-form')?.addEventListener('submit', saveRewardForm);
}

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", initDashboard);

// Manejar redimensionamiento de ventana para gráficos
window.addEventListener("resize", () => {
  Object.values(dashboardState.charts).forEach((chart) => {
    if (chart && typeof chart.resize === "function") {
      chart.resize();
    }
  });
});
