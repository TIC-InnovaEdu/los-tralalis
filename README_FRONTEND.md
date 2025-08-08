# 🦈 Shark Learns - Frontend

Sistema de autenticación y dashboard para el juego educativo Sharky aprende.

## 🚀 Características Implementadas

### ✅ Sistema de Autenticación

- **Login/Registro** conectado con APIs del backend
- **Validación JWT** automática
- **Manejo de roles** (Estudiante/Profesor)
- **Redirección automática** según el rol del usuario
- **Logout seguro** con limpieza de tokens

### ✅ Dashboard del Profesor

- **Resumen general** con estadísticas del sistema
- **Gestión de estudiantes** con búsqueda y filtros
- **Ranking de estudiantes** con podium y tabla completa
- **Analíticas avanzadas** (en desarrollo)
- **Gráficos interactivos** con Chart.js
- **Modales de detalles** de estudiantes
- **Interfaz completamente responsive**

### ✅ Panel del Estudiante

- **Perfil personal** con estadísticas propias
- **Historial de partidas** con detalles
- **Estadísticas de progreso** (promedio, mejor puntuación, precisión)
- **Sistema de niveles** basado en rendimiento
- **Interfaz optimizada para estudiantes**

## 📁 Estructura de Archivos

```
Proyecto_integrador/
├── index.html          # Página de login/registro
├── dashboard.html      # Dashboard del profesor
├── student.html        # Panel del estudiante
├── css/
│   ├── style.css       # Estilos principales (login/registro)
│   ├── dashboard.css   # Estilos del dashboard del profesor
│   └── student.css     # Estilos del panel del estudiante
├── js/
│   ├── app.js          # Lógica de login/registro
│   ├── dashboard.js    # Lógica del dashboard del profesor
│   └── student.js      # Lógica del panel del estudiante
├── img/
│   ├── shark-logo.png  # Logo del sistema
│   └── fondo-submarino.png # Imagen de fondo




### Frontend


## 👥 Usuarios de Prueba


### Profesor

- **Email:** `profesor@ejemplo.com`
- **Password:** `profesor123`
- **Acceso:** Dashboard completo con gestión de estudiantes

### Estudiantes

- **Email:** `ana@ejemplo.com` / **Password:** `estudiante123`
- **Email:** `carlos@ejemplo.com` / **Password:** `estudiante123`
- **Email:** `maria@ejemplo.com` / **Password:** `estudiante123`
- **Acceso:** Panel personal con estadísticas

## 🌊 Flujo de Uso

### 1. Registro/Login

1. Abrir `index.html`
2. Seleccionar rol (Estudiante/Profesor)
3. Registrarse o iniciar sesión
4. Redirección automática según el rol

### 2. Dashboard del Profesor

- **Resumen:** Estadísticas generales del sistema
- **Estudiantes:** Lista completa con búsqueda y detalles
- **Ranking:** Clasificación de estudiantes por rendimiento
- **Analíticas:** Gráficos y métricas avanzadas

### 3. Panel del Estudiante

- **Bienvenida:** Acceso rápido al juego
- **Estadísticas:** Progreso personal
- **Historial:** Últimas partidas jugadas
- **Perfil:** Información personal

## 🎨 Características del Diseño

### Responsive Design

- **Móviles:** Optimizado para pantallas de 320px+
- **Tablets:** Layout adaptativo para 768px+
- **Desktop:** Experiencia completa para 1200px+

### Animaciones y Efectos

- **Burbujas animadas** de fondo temático
- **Transiciones suaves** entre elementos
- **Estados hover/focus** mejorados
- **Loading spinners** con temática de tiburón
- **Efectos glassmorphism** en tarjetas

### Accesibilidad

- **Estados de focus** visibles
- **Contraste optimizado** para lectura
- **Navegación por teclado** funcional
- **Tamaños de texto escalables**

## 🔗 APIs Utilizadas

### Autenticación

- `POST /auth/register` - Registro de usuarios
- `POST /auth/login` - Inicio de sesión
- `GET /auth/verify` - Verificación de token
- `POST /auth/logout` - Cerrar sesión

### Dashboard (Profesores)

- `GET /dashboard/students` - Lista de estudiantes
- `GET /dashboard/students/:id` - Detalles de estudiante
- `GET /dashboard/ranking` - Ranking de estudiantes
- `GET /dashboard/stats` - Estadísticas del sistema

### Estudiantes

- `GET /users/me` - Perfil personal
- `GET /games/my-games` - Mis partidas
- `PUT /users/me` - Actualizar perfil

## 🚧 Funcionalidades Pendientes

- [ ] Juego principal (integración)
- [ ] Exportación de datos (CSV/PDF)
- [ ] Analíticas avanzadas con más gráficos
- [ ] Sistema de notificaciones
- [ ] Configuración de perfil completa
- [ ] Modo oscuro/claro

## 🐛 Solución de Problemas


### Problemas de autenticación

1. Limpiar localStorage del navegador
2. Verificar que los tokens JWT sean válidos
3. Comprobar que los usuarios existan en la base de datos

### Problemas de responsive

1. Verificar que el viewport meta tag esté presente
2. Comprobar el CSS para media queries
3. Testear en diferentes dispositivos

## 📱 Compatibilidad

- **Chrome:** ✅ Completa
- **Firefox:** ✅ Completa
- **Safari:** ✅ Completa
- **Edge:** ✅ Completa
- **Móviles:** ✅ iOS Safari, Chrome Mobile

---


