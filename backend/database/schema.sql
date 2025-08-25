
-- Tabla de usuarios (estudiantes y profesores)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de partidas
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    wrong_answers INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0, -- en segundos
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de detalles de cada pregunta en las partidas
CREATE TABLE IF NOT EXISTS game_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    question VARCHAR(255) NOT NULL,
    user_answer VARCHAR(50) NOT NULL,
    correct_answer VARCHAR(50) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Tabla de niveles de usuario
CREATE TABLE IF NOT EXISTS user_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    current_level INTEGER DEFAULT 1,
    current_experience INTEGER DEFAULT 0,
    total_experience INTEGER DEFAULT 0,
    last_level_up DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de configuración de niveles
CREATE TABLE IF NOT EXISTS level_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level_number INTEGER UNIQUE NOT NULL,
    experience_required INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    badge_icon TEXT DEFAULT '⭐',
    badge_color TEXT DEFAULT '#FFD700',
    rewards_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logros configurables
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    criteria_type TEXT CHECK(criteria_type IN ('games_played', 'score_reached', 'streak_days', 'accuracy_percentage', 'total_points', 'level_reached')),
    criteria_value INTEGER NOT NULL,
    points_reward INTEGER DEFAULT 0,
    badge_color TEXT DEFAULT '#FFD700',
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla de logros de usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    achievement_id INTEGER,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
);

-- Tabla de premios configurables
CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    reward_type TEXT CHECK(reward_type IN ('points', 'badge', 'title', 'custom')),
    reward_value TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla de premios de usuarios
CREATE TABLE IF NOT EXISTS user_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    reward_id INTEGER,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id),
    UNIQUE(user_id, reward_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_played_at ON games(played_at);
CREATE INDEX IF NOT EXISTS idx_games_ended_at ON games(ended_at);
CREATE INDEX IF NOT EXISTS idx_game_details_game_id ON game_details(game_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_level_config_level ON level_config(level_number);
CREATE INDEX IF NOT EXISTS idx_achievements_criteria ON achievements(criteria_type, criteria_value);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_points ON rewards(points_required);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);

-- Insertar un usuario profesor por defecto para testing
INSERT OR IGNORE INTO users (name, email, password, role) 
VALUES ('Profesor Admin', 'profesor@ejemplo.com', '$2a$10$example_hash_here', 'teacher');

-- Insertar niveles por defecto
INSERT OR IGNORE INTO level_config (level_number, experience_required, title, description, badge_icon, rewards_points) VALUES
(1, 0, 'Principiante', '¡Bienvenido al juego!', '⭐', 50),
(2, 100, 'Aprendiz', 'Ya conoces los básicos', '⭐', 100),
(3, 250, 'Estudiante', 'Vas mejorando', '⭐', 150),
(4, 500, 'Aplicado', 'Muy buen progreso', '⭐⭐', 200),
(5, 1000, 'Destacado', '¡Excelente trabajo!', '⭐⭐', 250),
(6, 2000, 'Experto', 'Dominas las matemáticas', '⭐⭐', 300),
(7, 3500, 'Maestro', 'Nivel superior alcanzado', '⭐⭐⭐', 350),
(8, 5000, 'Genio', '¡Eres un genio matemático!', '⭐⭐⭐', 400),
(9, 7500, 'Leyenda', 'Leyenda de las matemáticas', '⭐⭐⭐', 450),
(10, 10000, 'Supremo', '¡El más alto nivel!', '⭐⭐⭐', 500);

-- Insertar logros por defecto
INSERT OR IGNORE INTO achievements (name, description, icon, criteria_type, criteria_value, points_reward) VALUES
('Primera Victoria', 'Completa tu primera partida', '🎉', 'games_played', 1, 50),
('Jugador Frecuente', 'Juega 10 partidas', '🎮', 'games_played', 10, 100),
('Maestro del Juego', 'Juega 50 partidas', '👑', 'games_played', 50, 500),
('Puntuación Perfecta', 'Obtén 100 puntos en una partida', '💯', 'score_reached', 100, 200),
('Precisión Impecable', 'Alcanza 90% de precisión', '🎯', 'accuracy_percentage', 90, 150),
('Racha Ganadora', 'Gana 5 partidas seguidas', '🔥', 'streak_days', 5, 300),
('Nivel 5', 'Alcanza el nivel 5', '⭐', 'level_reached', 5, 400);