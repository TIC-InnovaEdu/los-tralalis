-- Limpiar datos existentes
DELETE FROM user_achievements;
DELETE FROM user_levels;
DELETE FROM user_rewards;
DELETE FROM achievements;
DELETE FROM level_config;
DELETE FROM rewards;

-- Insertar niveles simples (solo 5 niveles)
INSERT INTO level_config (level_number, experience_required, title, description, badge_icon, badge_color, rewards_points) VALUES
(1, 0, 'Principiante', 'Primer nivel del juego', '🌱', '#4CAF50', 10),
(2, 100, 'Aprendiz', 'Ya dominas lo básico', '⭐', '#2196F3', 20),
(3, 300, 'Competente', 'Buen progreso en matemáticas', '🏆', '#FF9800', 30),
(4, 600, 'Experto', 'Excelente nivel matemático', '💎', '#9C27B0', 50),
(5, 1000, 'Maestro', 'Nivel máximo alcanzado', '👑', '#FFD700', 100);

-- Insertar logros simples (solo 6 logros)
INSERT INTO achievements (name, description, icon, criteria_type, criteria_value, points_reward, badge_color, is_active, created_by) VALUES
('Primera Victoria', 'Completa tu primera partida', '🎯', 'games_played', 1, 10, '#4CAF50', 1, 1),
('Jugador Activo', 'Juega 5 partidas', '🎮', 'games_played', 5, 25, '#2196F3', 1, 1),
('Puntuación Alta', 'Alcanza 80 puntos en una partida', '🔥', 'score_reached', 80, 30, '#FF5722', 1, 1),
('Precisión', 'Logra 90% de precisión', '🎯', 'accuracy_percentage', 90, 40, '#9C27B0', 1, 1),
('Coleccionista', 'Acumula 500 puntos totales', '💰', 'total_points', 500, 50, '#FFD700', 1, 1),
('Nivel Avanzado', 'Alcanza el nivel 3', '⭐', 'level_reached', 3, 75, '#FF9800', 1, 1);

-- Insertar premios simples (solo 4 premios)
INSERT INTO rewards (name, description, reward_type, reward_value, points_required, is_active, created_by) VALUES
('Puntos Extra', 'Obtén 50 puntos adicionales', 'points', '50', 100, 1, 1),
('Insignia Dorada', 'Insignia especial dorada', 'badge', 'Insignia Dorada 🥇', 200, 1, 1),
('Título Especial', 'Título de Campeón Matemático', 'title', 'Campeón Matemático', 300, 1, 1),
('Premio Sorpresa', 'Un premio especial personalizado', 'custom', 'Certificado de Excelencia', 500, 1, 1);

-- Insertar algunos datos de usuario para pruebas
-- Asignar niveles iniciales a usuarios existentes
INSERT OR REPLACE INTO user_levels (user_id, current_level, current_experience, total_experience, last_level_up, created_at, updated_at)
SELECT 
    id,
    1,
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users WHERE role = 'student';

-- Otorgar algunos logros básicos a estudiantes activos
INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, earned_at)
SELECT 
    u.id,
    1, -- Primera Victoria
    CURRENT_TIMESTAMP
FROM users u 
WHERE u.role = 'student' 
AND EXISTS (SELECT 1 FROM games g WHERE g.user_id = u.id)
LIMIT 3;

COMMIT;