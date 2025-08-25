# 🦈 Sharky aprende API

API REST para el juego educativo de matemáticas Sharky aprende con sistema de niveles, logros y premios.

## 🚀 Características

- **Autenticación JWT** para estudiantes y profesores
- **Sistema de niveles** con experiencia y progresión
- **Logros configurables** basados en diferentes criterios
- **Sistema de premios** con puntos requeridos
- **Dashboard del profesor** con analytics avanzadas
- **Base de datos SQLite** con esquema consolidado
- **API RESTful** completa

## 📊 Esquema de Base de Datos Consolidado

El proyecto utiliza un **esquema consolidado** en `database/schema.sql` que incluye todas las tablas necesarias:

### Tablas Principales

- `users` - Usuarios (estudiantes y profesores)
- `games` - Partidas con timestamps de inicio y fin
- `game_details` - Detalles de cada pregunta en las partidas

### Sistema de Gamificación

- `user_levels` - Niveles y experiencia de cada usuario
- `level_config` - Configuración de niveles (experiencia requerida, títulos)
- `achievements` - Logros configurables por el profesor
- `user_achievements` - Logros obtenidos por usuarios
- `rewards` - Premios configurables
- `user_rewards` - Premios obtenidos por usuarios

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js >= 16.0.0
- npm

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd backend

# Instalar dependencias
npm install

# Inicializar base de datos (esquema consolidado)
npm run init-db

# Sembrar datos de prueba
npm run seed-db

# Iniciar servidor
npm start
```

## 📝 Scripts Disponibles

### Scripts Simplificados

- `npm run init-db` - Inicializa la base de datos con esquema consolidado y muestra verificación completa
- `npm run check-db` - Verifica el estado actual de la base de datos sin modificarla
- `npm run seed-db` - Puebla la base de datos con datos de prueba
- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon

### Scripts Eliminados (Consolidados)

- ~~`npm run init-levels`~~ - Ahora incluido en `init-db`
- ~~`npm run migrate`~~ - Migraciones incluidas en el esquema consolidado

### Ejemplos de Uso

```bash
# Inicializar base de datos completa con verificación
npm run init-db

# Verificar estado sin modificar
npm run check-db

# Poblar con datos de prueba
npm run seed-db

# Verificar después de poblar
npm run check-db
```

## 🔐 Credenciales de Prueba

### Profesor

- **Email:** profesor@ejemplo.com
- **Password:** profesor123

### Estudiantes

- **Email:** [nombre]@ejemplo.com (ej: ana@ejemplo.com)
- **Password:** estudiante123

## 🎯 Endpoints Principales

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de estudiantes

### Dashboard del Profesor

- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/students` - Lista de estudiantes
- `GET /api/dashboard/ranking` - Ranking de estudiantes
- `GET /api/dashboard/analysis` - Analytics avanzadas

### Niveles y Logros

- `GET /api/levels/config` - Configuración de niveles
- `GET /api/levels/user/:id` - Nivel de un usuario
- `POST /api/levels/achievements` - Crear logro
- `GET /api/levels/achievements` - Listar logros

### Juegos

- `POST /api/games` - Crear nueva partida
- `GET /api/games/user/:id` - Partidas de un usuario
- `GET /api/games/:id` - Detalles de una partida

## 🏗️ Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de base de datos
├── controllers/
│   ├── authController.js    # Controlador de autenticación
│   ├── dashboardController.js # Controlador del dashboard
│   ├── gameController.js    # Controlador de juegos
│   ├── levelsController.js  # Controlador de niveles y logros
│   └── userController.js    # Controlador de usuarios
├── database/
│   ├── schema.sql           # 🆕 Esquema consolidado
│   ├── init.js              # 🆕 Inicialización simplificada
│   └── seed-data.js         # Datos de prueba
├── middleware/
│   ├── auth.js              # Middleware de autenticación
│   └── validation.js        # Validación de datos
├── models/
│   ├── Game.js              # Modelo de juegos
│   ├── Level.js             # Modelo de niveles
│   ├── Achievement.js       # Modelo de logros
│   └── User.js              # Modelo de usuarios
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── dashboard.js         # Rutas del dashboard
│   ├── games.js             # Rutas de juegos
│   ├── levels.js            # Rutas de niveles
│   └── users.js             # Rutas de usuarios
├── server.js                # Servidor principal
└── package.json             # Dependencias y scripts
```

## 🎮 Sistema de Gamificación

### Niveles

- 10 niveles predefinidos (Principiante → Supremo)
- Experiencia basada en puntuación y aciertos
- Títulos y badges personalizables

### Logros

- **Tipos:** partidas jugadas, puntuación alcanzada, racha ganadora, precisión, nivel alcanzado
- **Configurables:** el profesor puede crear logros personalizados
- **Recompensas:** puntos automáticos al alcanzar logros

### Premios

- **Tipos:** puntos, badges, títulos, premios personalizados
- **Sistema:** puntos requeridos para canjear premios
- **Gestión:** el profesor puede configurar premios

## 📈 Analytics Avanzadas

El dashboard del profesor incluye:

- **Tendencias temporales** de rendimiento
- **Análisis por dificultad** de preguntas
- **Estadísticas detalladas** de rendimiento
- **Análisis temporal** por hora y día
- **Ranking dinámico** de estudiantes

## 🚀 Despliegue en Producción

### Ventajas del Esquema Consolidado

1. **Un solo archivo** para toda la estructura de BD
2. **Sin migraciones** separadas necesarias
3. **Inicialización simple** con un solo comando
4. **Menos complejidad** en el despliegue

### Pasos para Producción

```bash
# 1. Instalar dependencias
npm install --production

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con configuraciones de producción

# 3. Inicializar base de datos
npm run init-db

# 4. Iniciar servidor
npm start
```

## 🔧 Configuración de Entorno

Crear archivo `.env`:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=tu_jwt_secret_super_seguro
DB_PATH=./database/game.db
```

## 📝 Notas de Desarrollo

- **Esquema consolidado:** Todas las tablas están definidas en `schema.sql`
- **Sin migraciones:** Los cambios de esquema se manejan en el archivo principal
- **Datos de prueba:** Incluye niveles y logros predefinidos
- **API completa:** Todos los endpoints necesarios para el frontend

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
