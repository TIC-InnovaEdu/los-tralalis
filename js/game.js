// Math Shark Game - Main Game Logic

// Game Configuration
const GAME_CONFIG = {
  canvas: {
    width: 800,
    height: 600,
  },
  player: {
    size: 25,
    speed: 2,
    sprite: "🦈",
    color: "#3b82f6",
    glowColor: "#60a5fa",
  },
  enemy: {
    size: 25,
    speed: 1.5,
    sprites: ["🐙", "🦑", "🐡"],
    color: "#ef4444",
    count: 6,
    glowColor: "#f87171",
  },
  answer: {
    width: 35,
    height: 30,
    fontSize: 12,
    correctColor: "#10b981",
    wrongColor: "#6366f1",
    glowColor: "#34d399",
  },
  maze: {
    wallColor: "#0f172a",
    pathColor: "#1e293b",
    wallThickness: 25,
    glowColor: "#3b82f6",
  },
  game: {
    initialLives: 3,
    timeLimit: 90,
    pointsPerCorrect: 100,
    pointsPerIncorrect: -25,
    difficultyLevels: {
      1: {
        name: "Fácil",
        maxNum: 10,
        operations: ["+", "-"],
        timeBonus: 60,
        enemySpeed: 1,
      },
      2: {
        name: "Fácil+",
        maxNum: 15,
        operations: ["+", "-"],
        timeBonus: 50,
        enemySpeed: 1.2,
      },
      3: {
        name: "Intermedio",
        maxNum: 20,
        operations: ["+", "-", "×"],
        timeBonus: 45,
        enemySpeed: 1.4,
      },
      4: {
        name: "Intermedio+",
        maxNum: 25,
        operations: ["+", "-", "×"],
        timeBonus: 40,
        enemySpeed: 1.6,
      },
      5: {
        name: "Avanzado",
        maxNum: 30,
        operations: ["+", "-", "×", "÷"],
        timeBonus: 35,
        enemySpeed: 1.8,
      },
      6: {
        name: "Avanzado+",
        maxNum: 40,
        operations: ["+", "-", "×", "÷"],
        timeBonus: 30,
        enemySpeed: 2,
      },
      7: {
        name: "Experto",
        maxNum: 50,
        operations: ["+", "-", "×", "÷"],
        timeBonus: 25,
        enemySpeed: 2.2,
      },
      8: {
        name: "Experto+",
        maxNum: 75,
        operations: ["+", "-", "×", "÷"],
        timeBonus: 20,
        enemySpeed: 2.4,
      },
      9: {
        name: "Maestro",
        maxNum: 100,
        operations: ["+", "-", "×", "÷"],
        timeBonus: 15,
        enemySpeed: 2.6,
      },
      10: {
        name: "Extremo",
        maxNum: 150,
        operations: ["+", "-", "×", "÷"],
        timeBonus: 10,
        enemySpeed: 3,
      },
    },
  },
};

// API Configuration
const API_BASE_URL = "http://localhost:3000";

// Game State
const gameState = {
  isRunning: false,
  isPaused: false,
  score: 0,
  lives: GAME_CONFIG.game.initialLives,
  level: 1,
  timeRemaining: GAME_CONFIG.game.timeLimit,
  correctAnswers: 0,
  wrongAnswers: 0,
  startTime: null,
  currentQuestion: null,
  answers: [],
  player: { x: 50, y: 50 },
  enemies: [],
  maze: [],
  gameStartTime: null,
  answerSelected: false,
  lastAnswerTime: 0,
};

// Joystick State
const joystickState = {
  connected: false,
  port: null,
  reader: null,
  writer: null,
  lastButtonState: 1, // 1 = not pressed, 0 = pressed
  centerX: 512, // Center value for X axis
  centerY: 512, // Center value for Y axis
  deadzone: 100, // Deadzone around center
};

// Canvas and Context
let canvas, ctx;

// Input handling
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false,
};

// Game Initialization
function initGame() {
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  // Set canvas size
  canvas.width = GAME_CONFIG.canvas.width;
  canvas.height = GAME_CONFIG.canvas.height;

  // Setup event listeners
  setupEventListeners();

  // Initialize game components
  generateMaze();
  generateQuestion();
  spawnEnemies();

  // Start game loop
  gameState.isRunning = true;
  gameState.gameStartTime = Date.now();
  gameLoop();

  // Start timer
  startTimer();

  // Add level progression display
  showLevelInfo();
}

// Event Listeners Setup
function setupEventListeners() {
  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        keys.up = true;
        e.preventDefault();
        break;
      case "ArrowDown":
      case "KeyS":
        keys.down = true;
        e.preventDefault();
        break;
      case "ArrowLeft":
      case "KeyA":
        keys.left = true;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        keys.right = true;
        e.preventDefault();
        break;
      case "Space":
        keys.space = true;
        togglePause();
        e.preventDefault();
        break;
      case "Escape":
        togglePause();
        e.preventDefault();
        break;
    }
  });

  document.addEventListener("keyup", (e) => {
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        keys.up = false;
        break;
      case "ArrowDown":
      case "KeyS":
        keys.down = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        keys.left = false;
        break;
      case "ArrowRight":
      case "KeyD":
        keys.right = false;
        break;
      case "Space":
        keys.space = false;
        break;
    }
  });

  // UI Controls
  document.getElementById("pause-btn").addEventListener("click", togglePause);
  document.getElementById("exit-btn").addEventListener("click", exitGame);
  document.getElementById("resume-btn").addEventListener("click", togglePause);
  document.getElementById("restart-btn").addEventListener("click", restartGame);
  document.getElementById("quit-btn").addEventListener("click", exitGame);
  document
    .getElementById("play-again-btn")
    .addEventListener("click", restartGame);
  document
    .getElementById("back-to-panel-btn")
    .addEventListener("click", backToPanel);
  
  // Joystick event listeners
  document.getElementById("joystick-btn").addEventListener("click", showJoystickModal);
  document.getElementById("close-joystick-modal").addEventListener("click", hideJoystickModal);
  document.getElementById("connect-joystick").addEventListener("click", connectJoystick);
  document.getElementById("disconnect-joystick").addEventListener("click", disconnectJoystick);
}

// Maze Generation
// Diseños de laberinto predefinidos inspirados en Pacman
const MAZE_LAYOUTS = {
  1: {
    // Nivel 1 - Laberinto simple
    layout: [
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1,
        1, 0, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 1, 0, 0, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
      ],
    ],
  },
  2: {
    // Nivel 2 - Laberinto con más complejidad
    layout: [
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        1, 1, 0, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0,
        1, 1, 0, 0, 0, 1, 0, 1,
      ],
      [
        1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
        1, 1, 1, 1, 0, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 1, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1,
        1, 1, 0, 1, 0, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0,
        0, 1, 0, 1, 0, 0, 0, 0,
      ],
      [
        1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1,
        0, 1, 0, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        0, 1, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1,
        0, 1, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1,
        1, 1, 1, 0, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
        0, 0, 1, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1,
        1, 1, 0, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0,
        0, 1, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1,
        0, 1, 0, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1,
        0, 1, 0, 1, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1,
        0, 0, 0, 1, 0, 1, 0, 1,
      ],
      [
        1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1,
        1, 1, 0, 0, 0, 1, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
      ],
    ],
  },
  3: {
    // Nivel 3 - Laberinto estilo Pacman clásico
    layout: [
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 0, 0, 0, 0, 0,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 0, 1,
      ],
      [
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 1, 0, 0, 1, 1, 1,
      ],
      [
        1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 1,
      ],
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
      ],
    ],
  },
};

function generateMaze() {
  gameState.maze = [];
  const { width, height } = GAME_CONFIG.canvas;
  const wallThickness = GAME_CONFIG.maze.wallThickness;

  // Seleccionar diseño basado en el nivel (cicla entre los 3 diseños)
  const layoutIndex = ((gameState.level - 1) % 3) + 1;
  const mazeLayout = MAZE_LAYOUTS[layoutIndex];

  if (!mazeLayout) {
    // Fallback al diseño original si no existe el layout
    generateOriginalMaze();
    return;
  }

  const layout = mazeLayout.layout;
  const cellWidth = width / layout[0].length;
  const cellHeight = height / layout.length;

  // Convertir la matriz de diseño a paredes del juego
  for (let row = 0; row < layout.length; row++) {
    for (let col = 0; col < layout[row].length; col++) {
      if (layout[row][col] === 1) {
        // 1 representa una pared
        gameState.maze.push({
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
        });
      }
    }
  }

  // Encontrar posiciones seguras para el jugador (áreas abiertas)
  const safePositions = [];
  const playerSize = GAME_CONFIG.player.size;

  for (let row = 1; row < layout.length - 1; row++) {
    for (let col = 1; col < layout[row].length - 1; col++) {
      if (layout[row][col] === 0) {
        // 0 representa espacio abierto
        const x = col * cellWidth + cellWidth / 2;
        const y = row * cellHeight + cellHeight / 2;

        // Verificar que no hay colisión con paredes
        if (!checkWallCollision(x, y, playerSize)) {
          safePositions.push({ x, y });
        }
      }
    }
  }

  // Posicionar al jugador en una posición segura
  if (safePositions.length > 0) {
    const randomIndex = Math.floor(Math.random() * safePositions.length);
    gameState.player.x = safePositions[randomIndex].x;
    gameState.player.y = safePositions[randomIndex].y;
  } else {
    // Fallback a posición por defecto si no se encuentran posiciones seguras
    gameState.player.x = 50;
    gameState.player.y = 50;
  }
}

// Función de respaldo con el diseño original
function generateOriginalMaze() {
  gameState.maze = [];
  const { width, height } = GAME_CONFIG.canvas;
  const wallThickness = GAME_CONFIG.maze.wallThickness;

  // Create border walls
  gameState.maze.push(
    { x: 0, y: 0, width: width, height: wallThickness }, // Top
    { x: 0, y: height - wallThickness, width: width, height: wallThickness }, // Bottom
    { x: 0, y: 0, width: wallThickness, height: height }, // Left
    { x: width - wallThickness, y: 0, width: wallThickness, height: height } // Right
  );

  // Add complex internal walls to create maze structure
  const walls = [
    // Top section
    { x: 100, y: 80, width: 150, height: wallThickness },
    { x: 300, y: 80, width: 150, height: wallThickness },
    { x: 500, y: 80, width: 150, height: wallThickness },

    // Vertical walls
    { x: 150, y: 105, width: wallThickness, height: 120 },
    { x: 350, y: 105, width: wallThickness, height: 120 },
    { x: 550, y: 105, width: wallThickness, height: 120 },

    // Middle horizontal sections
    { x: 75, y: 200, width: 100, height: wallThickness },
    { x: 250, y: 200, width: 200, height: wallThickness },
    { x: 500, y: 200, width: 125, height: wallThickness },

    // Lower vertical walls
    { x: 125, y: 225, width: wallThickness, height: 100 },
    { x: 300, y: 225, width: wallThickness, height: 100 },
    { x: 475, y: 225, width: wallThickness, height: 100 },
    { x: 625, y: 225, width: wallThickness, height: 100 },

    // Bottom sections
    { x: 50, y: 350, width: 150, height: wallThickness },
    { x: 250, y: 350, width: 150, height: wallThickness },
    { x: 450, y: 350, width: 150, height: wallThickness },

    // Additional complexity
    { x: 175, y: 275, width: 100, height: wallThickness },
    { x: 425, y: 275, width: 100, height: wallThickness },
    { x: 75, y: 450, width: 200, height: wallThickness },
    { x: 350, y: 450, width: 200, height: wallThickness },
  ];

  gameState.maze.push(...walls);
}

// Question Generation
function generateQuestion() {
  const currentLevel = Math.min(gameState.level, 10);
  const difficulty = GAME_CONFIG.game.difficultyLevels[currentLevel];

  const operations = difficulty.operations;
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, correctAnswer;
  const maxNum = difficulty.maxNum;

  switch (operation) {
    case "+":
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      correctAnswer = num1 + num2;
      break;
    case "-":
      num1 = Math.floor(Math.random() * maxNum) + Math.floor(maxNum / 2);
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      correctAnswer = num1 - num2;
      break;
    case "×":
      const maxMult = Math.min(Math.floor(maxNum / 3), 15);
      num1 = Math.floor(Math.random() * maxMult) + 1;
      num2 = Math.floor(Math.random() * maxMult) + 1;
      correctAnswer = num1 * num2;
      break;
    case "÷":
      correctAnswer = Math.floor(Math.random() * Math.min(maxNum / 2, 20)) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      num1 = correctAnswer * num2;
      break;
  }

  gameState.currentQuestion = {
    text: `${num1} ${operation} ${num2} = ?`,
    correctAnswer: correctAnswer,
    difficulty: difficulty.name,
  };

  // Update question display with difficulty indicator
  document.getElementById("current-question").textContent =
    gameState.currentQuestion.text;

  // Generate answer options and place them in the maze
  generateAnswerOptions(correctAnswer);
}

// Generate Answer Options
function generateAnswerOptions(correctAnswer) {
  const answers = [correctAnswer];

  // Generate 3 wrong answers
  while (answers.length < 4) {
    let wrongAnswer;
    if (correctAnswer <= 10) {
      wrongAnswer = Math.floor(Math.random() * 20) + 1;
    } else {
      const variance = Math.max(5, Math.floor(correctAnswer * 0.3));
      wrongAnswer =
        correctAnswer + (Math.floor(Math.random() * variance * 2) - variance);
    }

    if (wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
      answers.push(wrongAnswer);
    }
  }

  // Shuffle answers
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  // Find valid positions for answers in open areas of the maze
  const validPositions = [];
  const cellSize = GAME_CONFIG.maze.wallThickness;
  const answerWidth = GAME_CONFIG.answer.width;
  const answerHeight = GAME_CONFIG.answer.height;
  const layout = MAZE_LAYOUTS[Math.min(gameState.level, 3)].layout;

  // Search for open areas in the maze with better spacing, avoiding center
  const centerRow = Math.floor(layout.length / 2);
  const centerCol = Math.floor(layout[0].length / 2);
  const centerExclusionRadius = 4; // Exclude 4 cells around center
  
  for (let row = 2; row < layout.length - 2; row++) {
    for (let col = 2; col < layout[0].length - 2; col++) {
      if (layout[row][col] === 0) {
        // Skip positions too close to center
        const distanceFromCenter = Math.sqrt(
          Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
        );
        if (distanceFromCenter < centerExclusionRadius) {
          continue;
        }
        
        // Check if there's enough open space around this cell (2x2 area for smaller answers)
        let hasEnoughSpace = true;
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = 0; dc <= 1; dc++) {
            const checkRow = row + dr;
            const checkCol = col + dc;
            if (
              checkRow >= 0 &&
              checkRow < layout.length &&
              checkCol >= 0 &&
              checkCol < layout[0].length
            ) {
              if (layout[checkRow][checkCol] === 1) {
                hasEnoughSpace = false;
                break;
              }
            }
          }
          if (!hasEnoughSpace) break;
        }

        if (hasEnoughSpace) {
          const x = col * cellSize + cellSize / 2 - answerWidth / 2;
          const y = row * cellSize + cellSize / 2 - answerHeight / 2;

          // Check distance from player position (avoid placing answers near player)
          const playerX = gameState.player.x;
          const playerY = gameState.player.y;
          const distanceFromPlayer = Math.sqrt(
            Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2)
          );

          // Ensure position is within canvas bounds with proper margins and away from player
          if (
            x > answerWidth / 2 + 10 &&
            y > answerHeight / 2 + 10 &&
            x < canvas.width - answerWidth / 2 - 10 &&
            y < canvas.height - answerHeight / 2 - 10 &&
            distanceFromPlayer > 120 // Minimum distance from player
          ) {
            validPositions.push({ x, y });
          }
        }
      }
    }
  }

  // If we don't have enough valid positions, add some safe fallback positions (avoiding center and player corner)
  const fallbackPositions = [
    { x: 650, y: 100 },   // Top right
    { x: 650, y: 450 },   // Bottom right
    { x: 300, y: 450 },   // Bottom center
    { x: 500, y: 200 },   // Middle right
    { x: 600, y: 200 },   // Right side
    { x: 500, y: 350 },   // Lower right
    { x: 400, y: 100 },   // Top center-right
    { x: 300, y: 300 },   // Center-right
  ];

  // Add fallback positions if needed
  for (const fallback of fallbackPositions) {
    if (validPositions.length >= 8) break;
    validPositions.push(fallback);
  }

  // Shuffle positions to ensure random placement
  for (let i = validPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validPositions[i], validPositions[j]] = [
      validPositions[j],
      validPositions[i],
    ];
  }

  // Select 4 different positions for the answers
  const selectedPositions = [];
  for (let i = 0; i < 4 && i < validPositions.length; i++) {
    selectedPositions.push(validPositions[i]);
  }

  gameState.answers = answers.map((answer, index) => ({
    value: answer,
    x: selectedPositions[index].x,
    y: selectedPositions[index].y,
    targetX: selectedPositions[index].x,
    targetY: selectedPositions[index].y,
    width: GAME_CONFIG.answer.width,
    height: GAME_CONFIG.answer.height,
    isCorrect: answer === correctAnswer,
    highlighted: null,
    speed: 0.5 + Math.random() * 0.5,
    direction: Math.random() * Math.PI * 2,
    lastMoveTime: Date.now(),
    validPositions: validPositions,
  }));
}

// Update moving answers
function updateAnswers() {
  const currentTime = Date.now();

  gameState.answers.forEach((answer) => {
    // Move answers every 2-3 seconds
    if (currentTime - answer.lastMoveTime > 2000 + Math.random() * 1000) {
      // Find a new target position
      const validPositions = answer.validPositions;
      if (validPositions && validPositions.length > 0) {
        const newTarget =
          validPositions[Math.floor(Math.random() * validPositions.length)];
        answer.targetX = newTarget.x;
        answer.targetY = newTarget.y;
        answer.lastMoveTime = currentTime;
      }
    }

    // Move towards target position
    const dx = answer.targetX - answer.x;
    const dy = answer.targetY - answer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      const moveX = (dx / distance) * answer.speed;
      const moveY = (dy / distance) * answer.speed;

      // Check if new position is valid (no wall collision)
      const newX = answer.x + moveX;
      const newY = answer.y + moveY;

      if (
        !checkWallCollision(
          newX,
          newY,
          Math.min(answer.width, answer.height) * 0.8
        )
      ) {
        answer.x = newX;
        answer.y = newY;
      } else {
        // If blocked, find a new target immediately
        const validPositions = answer.validPositions;
        if (validPositions && validPositions.length > 0) {
          const newTarget =
            validPositions[Math.floor(Math.random() * validPositions.length)];
          answer.targetX = newTarget.x;
          answer.targetY = newTarget.y;
        }
      }
    }
  });
}

// Spawn Enemies
function spawnEnemies() {
  gameState.enemies = [];
  const currentLevel = Math.min(gameState.level, 10);
  const difficulty = GAME_CONFIG.game.difficultyLevels[currentLevel];
  const { width, height } = GAME_CONFIG.canvas;

  // Determinar el layout actual
  const layoutIndex = ((gameState.level - 1) % 3) + 1;
  const mazeLayout = MAZE_LAYOUTS[layoutIndex];

  let spawnPositions = [];

  if (mazeLayout) {
    // Buscar posiciones estratégicas en el layout actual
    const layout = mazeLayout.layout;
    const cellWidth = width / layout[0].length;
    const cellHeight = height / layout.length;

    // Buscar esquinas y áreas abiertas para spawn de enemigos
    const potentialSpawns = [];

    for (let row = 2; row < layout.length - 2; row++) {
      for (let col = 2; col < layout[row].length - 2; col++) {
        if (layout[row][col] === 0) {
          // Verificar que hay suficiente espacio alrededor
          let openArea = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (layout[row + dr] && layout[row + dr][col + dc] === 0) {
                openArea++;
              }
            }
          }

          // Preferir áreas más abiertas para enemigos
          if (openArea >= 5) {
            potentialSpawns.push({
              x: col * cellWidth + cellWidth / 2,
              y: row * cellHeight + cellHeight / 2,
              openness: openArea,
            });
          }
        }
      }
    }

    // Ordenar por apertura (más abierto primero) y tomar las mejores posiciones
    potentialSpawns.sort((a, b) => b.openness - a.openness);
    spawnPositions = potentialSpawns
      .slice(0, 8)
      .map((pos) => ({ x: pos.x, y: pos.y }));
  }

  // Fallback a posiciones predeterminadas si no se encontraron suficientes
  if (spawnPositions.length < 5) {
    spawnPositions = [
      { x: width - 100, y: height - 100 },
      { x: 100, y: height / 2 },
      { x: width / 2, y: 100 },
      { x: width - 100, y: height / 3 },
      { x: width / 4, y: height - 100 },
      { x: (3 * width) / 4, y: height / 4 },
      { x: width / 3, y: (2 * height) / 3 },
      { x: (2 * width) / 3, y: height / 3 },
    ];
  }

  // Increase enemy count based on level
  const enemyCount = Math.min(
    GAME_CONFIG.enemy.count + Math.floor(gameState.level / 2),
    8
  );

  // Calculate consistent enemy speed based on difficulty
  const baseSpeed = GAME_CONFIG.enemy.speed;
  const levelMultiplier = difficulty ? difficulty.enemySpeed : 1;
  const finalSpeed = baseSpeed * levelMultiplier;

  for (let i = 0; i < enemyCount; i++) {
    const sprite =
      GAME_CONFIG.enemy.sprites[i % GAME_CONFIG.enemy.sprites.length];
    const spawnPos = spawnPositions[i % spawnPositions.length];

    // Verificar que la posición no colisiona con paredes
    let finalX = spawnPos.x;
    let finalY = spawnPos.y;

    if (checkWallCollision(finalX, finalY, GAME_CONFIG.enemy.size)) {
      // Si hay colisión, buscar una posición cercana libre
      let found = false;
      for (let attempts = 0; attempts < 10 && !found; attempts++) {
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        const testX = Math.max(50, Math.min(width - 50, spawnPos.x + offsetX));
        const testY = Math.max(50, Math.min(height - 50, spawnPos.y + offsetY));

        if (!checkWallCollision(testX, testY, GAME_CONFIG.enemy.size)) {
          finalX = testX;
          finalY = testY;
          found = true;
        }
      }
    }

    gameState.enemies.push({
      x: finalX,
      y: finalY,
      size: GAME_CONFIG.enemy.size,
      speed: finalSpeed,
      sprite: sprite,
      direction: Math.random() * Math.PI * 2,
      changeDirectionTimer: 0,
      baseSpeed: finalSpeed, // Store base speed to prevent drift
    });
  }
}

// Game Loop
function gameLoop() {
  if (!gameState.isRunning || gameState.isPaused) {
    if (gameState.isRunning) {
      requestAnimationFrame(gameLoop);
    }
    return;
  }

  // Update game logic
  updatePlayer();
  updateEnemies();
  updateAnswers();
  checkCollisions();

  // Render game
  render();

  // Continue loop
  requestAnimationFrame(gameLoop);
}

// Update Player
function updatePlayer() {
  const player = gameState.player;
  const speed = GAME_CONFIG.player.speed;
  const playerSize = GAME_CONFIG.player.size;

  let newX = player.x;
  let newY = player.y;
  let moved = false;

  // Check horizontal movement with consistent speed
  if (keys.left) {
    newX = player.x - speed;
    if (!checkWallCollision(newX, player.y, playerSize * 0.6)) {
      player.x = newX;
      moved = true;
    }
  }
  if (keys.right) {
    newX = player.x + speed;
    if (!checkWallCollision(newX, player.y, playerSize * 0.6)) {
      player.x = newX;
      moved = true;
    }
  }

  // Check vertical movement with consistent speed
  if (keys.up) {
    newY = player.y - speed;
    if (!checkWallCollision(player.x, newY, playerSize * 0.6)) {
      player.y = newY;
      moved = true;
    }
  }
  if (keys.down) {
    newY = player.y + speed;
    if (!checkWallCollision(player.x, newY, playerSize * 0.6)) {
      player.y = newY;
      moved = true;
    }
  }

  // Simple collision handling - no complex repositioning

  // Pacman-style tunnel effect: wrap around horizontally
  const margin = playerSize / 2;
  if (player.x < -margin) {
    player.x = canvas.width + margin;
  } else if (player.x > canvas.width + margin) {
    player.x = -margin;
  }

  // Keep player within vertical bounds
  player.y = Math.max(
    margin + 5,
    Math.min(canvas.height - margin - 5, player.y)
  );
}

// Update Enemies
function updateEnemies() {
  gameState.enemies.forEach((enemy) => {
    const dx = gameState.player.x - enemy.x;
    const dy = gameState.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Initialize patrol state if not set
    if (!enemy.patrolState) {
      enemy.patrolState = {
        mode: 'patrol', // 'patrol' or 'chase'
        direction: Math.random() * Math.PI * 2,
        changeDirectionTimer: 0,
        lastPlayerDistance: distance
      };
    }

    const detectionRange = 120; // Reduced detection range for more realistic behavior
    const losePlayerRange = 180; // Range at which enemy loses player

    // State management: patrol vs chase
    if (enemy.patrolState.mode === 'patrol' && distance < detectionRange) {
      enemy.patrolState.mode = 'chase';
    } else if (enemy.patrolState.mode === 'chase' && distance > losePlayerRange) {
      enemy.patrolState.mode = 'patrol';
      // Reset patrol direction when losing player
      enemy.patrolState.direction = Math.random() * Math.PI * 2;
      enemy.patrolState.changeDirectionTimer = 0;
    }

    let targetX, targetY;

    if (enemy.patrolState.mode === 'chase') {
      // Chase mode: direct pursuit with consistent speed
      const angle = Math.atan2(dy, dx);
      targetX = enemy.x + Math.cos(angle) * enemy.speed;
      targetY = enemy.y + Math.sin(angle) * enemy.speed;
    } else {
      // Patrol mode: Pac-Man ghost-like movement with consistent speed
      
      // Change direction periodically or when hitting walls
      enemy.patrolState.changeDirectionTimer++;
      if (enemy.patrolState.changeDirectionTimer > 60 + Math.random() * 120) {
        enemy.patrolState.direction = Math.random() * Math.PI * 2;
        enemy.patrolState.changeDirectionTimer = 0;
      }

      targetX = enemy.x + Math.cos(enemy.patrolState.direction) * enemy.speed;
      targetY = enemy.y + Math.sin(enemy.patrolState.direction) * enemy.speed;
    }

    // Move towards target with wall collision detection
    const collisionSize = enemy.size * 0.6;
    let moved = false;

    // Try to move to target position
    if (!checkWallCollision(targetX, targetY, collisionSize)) {
      enemy.x = targetX;
      enemy.y = targetY;
      moved = true;
    } else {
      // Try horizontal movement only
      if (!checkWallCollision(targetX, enemy.y, collisionSize)) {
        enemy.x = targetX;
        moved = true;
      }
      // Try vertical movement only
      if (!checkWallCollision(enemy.x, targetY, collisionSize)) {
        enemy.y = targetY;
        moved = true;
      }
    }

    // If blocked and in patrol mode, change direction
    if (!moved && enemy.patrolState.mode === 'patrol') {
      const possibleDirections = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
      const currentDir = enemy.patrolState.direction;
      
      // Try different directions
      for (let i = 0; i < possibleDirections.length; i++) {
        const testDir = possibleDirections[i];
        if (Math.abs(testDir - currentDir) > 0.1) { // Avoid current direction
          const testX = enemy.x + Math.cos(testDir) * enemy.speed;
          const testY = enemy.y + Math.sin(testDir) * enemy.speed;
          
          if (!checkWallCollision(testX, testY, collisionSize)) {
            enemy.patrolState.direction = testDir;
            enemy.patrolState.changeDirectionTimer = 0;
            break;
          }
        }
      }
    }

    // Horizontal wrapping (Pac-Man style)
    const margin = enemy.size / 2;
    if (enemy.x < -margin) {
      enemy.x = canvas.width + margin;
    } else if (enemy.x > canvas.width + margin) {
      enemy.x = -margin;
    }

    // Keep enemies within vertical bounds
    enemy.y = Math.max(
      margin + 5,
      Math.min(canvas.height - margin - 5, enemy.y)
    );
  });
}

// Check Wall Collision
function checkWallCollision(x, y, size) {
  const halfSize = size / 2;

  for (const wall of gameState.maze) {
    if (
      x - halfSize < wall.x + wall.width &&
      x + halfSize > wall.x &&
      y - halfSize < wall.y + wall.height &&
      y + halfSize > wall.y
    ) {
      return true;
    }
  }
  return false;
}

// Check Collisions
function checkCollisions() {
  const player = gameState.player;
  const playerSize = GAME_CONFIG.player.size;

  // Check enemy collisions
  gameState.enemies.forEach((enemy) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < (playerSize + enemy.size) / 2) {
      loseLife();
    }
  });

  // Check answer collisions (prevent multiple selections)
  if (!gameState.answerSelected) {
    gameState.answers.forEach((answer, index) => {
      const playerHalfSize = playerSize / 2;
      if (
        player.x + playerHalfSize > answer.x &&
        player.x - playerHalfSize < answer.x + answer.width &&
        player.y + playerHalfSize > answer.y &&
        player.y - playerHalfSize < answer.y + answer.height
      ) {
        selectAnswer(answer, index);
      }
    });
  }
}

// Reset Player Position
function resetPlayerPosition() {
  const { width, height } = GAME_CONFIG.canvas;
  const playerSize = GAME_CONFIG.player.size;

  // Determinar el layout actual
  const layoutIndex = ((gameState.level - 1) % 3) + 1;
  const mazeLayout = MAZE_LAYOUTS[layoutIndex];

  if (mazeLayout) {
    // Buscar posiciones seguras específicas para cada layout
    const layout = mazeLayout.layout;
    const cellWidth = width / layout[0].length;
    const cellHeight = height / layout.length;

    // Buscar celdas vacías (0) en el layout para posicionar al jugador
    const safePositions = [];

    for (let row = 2; row < layout.length - 2; row++) {
      for (let col = 2; col < layout[row].length - 2; col++) {
        if (layout[row][col] === 0) {
          // Verificar que hay espacio suficiente alrededor (área 3x3)
          let hasSpace = true;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (
                row + dr >= 0 &&
                row + dr < layout.length &&
                col + dc >= 0 &&
                col + dc < layout[row].length
              ) {
                if (layout[row + dr][col + dc] === 1) {
                  hasSpace = false;
                  break;
                }
              }
            }
            if (!hasSpace) break;
          }

          if (hasSpace) {
            const x = col * cellWidth + cellWidth / 2;
            const y = row * cellHeight + cellHeight / 2;

            // Evitar el centro exacto del canvas
            const centerX = width / 2;
            const centerY = height / 2;
            const distanceFromCenter = Math.sqrt(
              (x - centerX) ** 2 + (y - centerY) ** 2
            );

            // Verificar que no haya respuestas cerca
            let clearOfAnswers = true;
            if (gameState.answers) {
              for (let answer of gameState.answers) {
                const answerDx = x - answer.x;
                const answerDy = y - answer.y;
                const answerDistance = Math.sqrt(answerDx * answerDx + answerDy * answerDy);
                if (answerDistance < 80) {
                  clearOfAnswers = false;
                  break;
                }
              }
            }

            // Verificar que no haya enemigos cerca
            let clearOfEnemies = true;
            if (gameState.enemies) {
              for (let enemy of gameState.enemies) {
                const enemyDx = x - enemy.x;
                const enemyDy = y - enemy.y;
                const enemyDistance = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);
                if (enemyDistance < 100) {
                  clearOfEnemies = false;
                  break;
                }
              }
            }

            // Solo agregar si no está muy cerca del centro, no hay respuestas cerca y no hay enemigos cerca
            if (distanceFromCenter > 120 && clearOfAnswers && clearOfEnemies) {
              safePositions.push({ x, y });
            }
          }
        }
      }
    }

    // Si encontramos posiciones seguras, usar una aleatoria
    if (safePositions.length > 0) {
      const randomPos =
        safePositions[Math.floor(Math.random() * safePositions.length)];
      gameState.player.x = randomPos.x;
      gameState.player.y = randomPos.y;
      return;
    }
  }

  // Fallback: posiciones específicas seguras evitando el centro
  const fallbackPositions = [
    { x: 75, y: 75 },
    { x: 75, y: height - 75 },
    { x: width - 75, y: 75 },
    { x: width - 75, y: height - 75 },
    { x: width / 4, y: 75 },
    { x: (3 * width) / 4, y: 75 },
    { x: 75, y: height / 4 },
    { x: width - 75, y: height / 4 },
    { x: width / 4, y: (3 * height) / 4 },
    { x: (3 * width) / 4, y: (3 * height) / 4 },
  ];

  for (let pos of fallbackPositions) {
    if (!checkWallCollision(pos.x, pos.y, playerSize)) {
      gameState.player.x = pos.x;
      gameState.player.y = pos.y;
      return;
    }
  }

  // Último recurso: buscar cualquier posición válida
  for (let attempts = 0; attempts < 100; attempts++) {
    const x = Math.random() * (width - 100) + 50;
    const y = Math.random() * (height - 100) + 50;

    if (!checkWallCollision(x, y, playerSize)) {
      gameState.player.x = x;
      gameState.player.y = y;
      return;
    }
  }

  // Posición por defecto si todo falla
  gameState.player.x = 75;
  gameState.player.y = 75;
}

// Select Answer
function selectAnswer(answer, index) {
  // Prevent multiple selections
  if (gameState.answerSelected) return;

  gameState.answerSelected = true;
  gameState.lastAnswerTime = Date.now();

  if (answer.isCorrect) {
    // Correct answer
    gameState.score += GAME_CONFIG.game.pointsPerCorrect + gameState.level * 10;
    gameState.correctAnswers++;

    // Highlight correct answer in green
    answer.highlighted = "correct";

    // Show success effect
    showAnswerFeedback(true, answer);

    // Reset player to a safe starting position
    resetPlayerPosition();

    // Generate new question after delay
    setTimeout(() => {
      generateQuestion();
      gameState.answerSelected = false;

      // Increase level every 3 correct answers (faster progression)
      if (gameState.correctAnswers % 3 === 0) {
        levelUp();
      }
    }, 1500);
  } else {
    // Wrong answer
    gameState.score = Math.max(
      0,
      gameState.score + GAME_CONFIG.game.pointsPerIncorrect
    );
    gameState.wrongAnswers++;

    // Highlight wrong answer in red
    answer.highlighted = "wrong";

    // Show correct answer in green
    gameState.answers.forEach((ans) => {
      if (ans.isCorrect) ans.highlighted = "correct";
    });

    // Show error effect
    showAnswerFeedback(false, answer);

    // Generate new question after delay
    setTimeout(() => {
      generateQuestion();
      gameState.answerSelected = false;
    }, 2000);
  }

  // Update UI
  updateUI();
}

// Show Answer Feedback
function showAnswerFeedback(isCorrect, answer) {
  // This could be enhanced with visual effects
  console.log(isCorrect ? "Correct!" : "Wrong!");
}

// Lose Life
function loseLife() {
  gameState.lives--;
  updateUI();

  if (gameState.lives <= 0) {
    gameOver();
  } else {
    // Reset player position using the safe positioning function
    resetPlayerPosition();

    // Brief invincibility period
    setTimeout(() => {
      // Reset enemy positions
      spawnEnemies();
    }, 1000);
  }
}

// Level Up
function levelUp() {
  gameState.level++;
  gameState.timeRemaining += 30; // Bonus time

  // Show level up information
  showLevelInfo();

  // Show level up notification
  showAchievementNotification(
    `¡Nivel ${gameState.level}!`,
    "Has subido de nivel"
  );

  updateUI();
}

// Update UI
function updateUI() {
  document.getElementById("score").textContent = gameState.score;
  document.getElementById("lives").textContent = gameState.lives;
  document.getElementById("level").textContent = gameState.level;
  document.getElementById("timer").textContent = gameState.timeRemaining;

  // Update difficulty indicator
  updateDifficultyIndicator();
}

// Show level information
function showLevelInfo() {
  const levelInfo = GAME_CONFIG.game.difficultyLevels[gameState.level - 1];
  if (levelInfo) {
    // Create level info overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-family: 'Baloo 2', cursive;
        `;

    overlay.innerHTML = `
            <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <h2 style="font-size: 2.5em; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🌊 Nivel ${
                  gameState.level
                } 🌊</h2>
                <p style="font-size: 1.5em; margin: 10px 0;">Dificultad: <strong>${
                  levelInfo.name
                }</strong></p>
                <p style="font-size: 1.2em; margin: 10px 0;">Operaciones: ${levelInfo.operations.join(
                  ", "
                )}</p>
                <p style="font-size: 1.2em; margin: 10px 0;">Números hasta: ${
                  levelInfo.maxNum
                }</p>
                <p style="font-size: 1em; margin: 20px 0; opacity: 0.9;">¡Prepárate para el desafío!</p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                    border: none;
                    color: white;
                    padding: 15px 30px;
                    font-size: 1.2em;
                    border-radius: 25px;
                    cursor: pointer;
                    font-family: 'Baloo 2', cursive;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">¡Comenzar!</button>
            </div>
        `;

    document.body.appendChild(overlay);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
    }, 5000);
  }
}

// Update difficulty indicator
function updateDifficultyIndicator() {
  const levelInfo = GAME_CONFIG.game.difficultyLevels[gameState.level - 1];
  if (levelInfo) {
    const difficultyElement = document.getElementById("difficulty");
    if (difficultyElement) {
      difficultyElement.textContent = levelInfo.name;
      difficultyElement.className = `difficulty-${levelInfo.name.toLowerCase()}`;
    }
  }
}

// Timer
function startTimer() {
  const timerInterval = setInterval(() => {
    if (!gameState.isRunning || gameState.isPaused) {
      return;
    }

    gameState.timeRemaining--;
    updateUI();

    if (gameState.timeRemaining <= 0) {
      clearInterval(timerInterval);
      gameOver();
    }
  }, 1000);
}

// Render Game
function render() {
  // Clear canvas with enhanced animated background
  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height)
  );
  gradient.addColorStop(0, "#1e3a8a");
  gradient.addColorStop(0.3, "#1e40af");
  gradient.addColorStop(0.7, "#1d4ed8");
  gradient.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add animated bubbles effect
  drawAnimatedBackground();

  // Draw maze walls with enhanced 3D effect
  gameState.maze.forEach((wall) => {
    // Main wall with gradient
    const wallGradient = ctx.createLinearGradient(
      wall.x,
      wall.y,
      wall.x + wall.width,
      wall.y + wall.height
    );
    wallGradient.addColorStop(0, "#0f172a");
    wallGradient.addColorStop(0.5, "#1e293b");
    wallGradient.addColorStop(1, "#0f172a");

    // Outer glow
    ctx.shadowColor = "#3b82f6";
    ctx.shadowBlur = 15;
    ctx.fillStyle = wallGradient;
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

    // Inner highlight for 3D effect
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#334155";
    ctx.fillRect(wall.x + 2, wall.y + 2, wall.width - 4, wall.height - 4);

    // Border for definition
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
  });

  ctx.shadowBlur = 0;

  // Draw answers with enhanced visuals
  gameState.answers.forEach((answer) => {
    // Determine colors based on highlighting
    let bgColor1, bgColor2, glowColor;

    if (answer.highlighted === "correct") {
      bgColor1 = "#10b981";
      bgColor2 = "#059669";
      glowColor = "#34d399";
    } else if (answer.highlighted === "wrong") {
      bgColor1 = "#ef4444";
      bgColor2 = "#dc2626";
      glowColor = "#f87171";
    } else {
      bgColor1 = GAME_CONFIG.answer.wrongColor;
      bgColor2 = "#4f46e5";
      glowColor = "#6366f1";
    }

    // Answer glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = answer.highlighted ? 20 : 15;

    // Answer background with gradient
    const gradient = ctx.createLinearGradient(
      answer.x,
      answer.y,
      answer.x + answer.width,
      answer.y + answer.height
    );
    gradient.addColorStop(0, bgColor1);
    gradient.addColorStop(1, bgColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(answer.x, answer.y, answer.width, answer.height);

    // Answer border with animation
    ctx.strokeStyle = answer.highlighted ? "#ffffff" : "#e5e7eb";
    ctx.lineWidth = answer.highlighted ? 4 : 3;
    ctx.strokeRect(answer.x, answer.y, answer.width, answer.height);

    // Answer text with better styling
    ctx.shadowBlur = 5;
    ctx.shadowColor = "#000000";
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${GAME_CONFIG.answer.fontSize}px 'Baloo 2', cursive`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      answer.value.toString(),
      answer.x + answer.width / 2,
      answer.y + answer.height / 2
    );
    ctx.shadowBlur = 0;
  });

  // Draw enemies with sprites and glow
  gameState.enemies.forEach((enemy) => {
    // Enemy glow effect
    ctx.shadowColor = GAME_CONFIG.enemy.glowColor;
    ctx.shadowBlur = 20;

    // Draw enemy sprite
    ctx.font = `${enemy.size}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(enemy.sprite, enemy.x, enemy.y);

    ctx.shadowBlur = 0;
  });

  // Draw player with sprite and enhanced glow
  ctx.shadowColor = GAME_CONFIG.player.glowColor;
  ctx.shadowBlur = 25;

  // Draw player sprite
  ctx.font = `${GAME_CONFIG.player.size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    GAME_CONFIG.player.sprite,
    gameState.player.x,
    gameState.player.y
  );

  ctx.shadowBlur = 0;
}

// Draw animated background effects
function drawAnimatedBackground() {
  const time = Date.now() * 0.001;

  // Floating particles
  for (let i = 0; i < 8; i++) {
    const x = Math.sin(time + i) * 100 + canvas.width / 2;
    const y = Math.cos(time * 0.7 + i) * 80 + canvas.height / 2;
    const size = Math.sin(time + i) * 2 + 3;

    ctx.fillStyle = `rgba(59, 130, 246, ${0.1 + Math.sin(time + i) * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Game Control Functions
function togglePause() {
  gameState.isPaused = !gameState.isPaused;

  if (gameState.isPaused) {
    document.getElementById("pause-modal").classList.remove("hidden");
  } else {
    document.getElementById("pause-modal").classList.add("hidden");
    if (gameState.isRunning) {
      gameLoop();
    }
  }
}

function restartGame() {
  // Reset game state
  gameState.isRunning = false;
  gameState.isPaused = false;
  gameState.score = 0;
  gameState.lives = GAME_CONFIG.game.initialLives;
  gameState.level = 1;
  gameState.timeRemaining = GAME_CONFIG.game.timeLimit;
  gameState.correctAnswers = 0;
  gameState.wrongAnswers = 0;
  gameState.player = { x: 50, y: 50 };

  // Hide modals
  document.getElementById("pause-modal").classList.add("hidden");
  document.getElementById("game-over-modal").classList.add("hidden");

  // Restart game
  initGame();
}

function exitGame() {
  gameState.isRunning = false;
  backToPanel();
}

function backToPanel() {
  window.location.href = "student.html";
}

// Game Over
function gameOver() {
  gameState.isRunning = false;

  // Calculate final stats
  const totalQuestions = gameState.correctAnswers + gameState.wrongAnswers;
  const accuracy =
    totalQuestions > 0
      ? Math.round((gameState.correctAnswers / totalQuestions) * 100)
      : 0;
  const timePlayed = Math.floor((Date.now() - gameState.gameStartTime) / 1000);

  // Update game over modal
  document.getElementById("final-score").textContent = gameState.score;
  document.getElementById("correct-answers").textContent =
    gameState.correctAnswers;
  document.getElementById("wrong-answers").textContent = gameState.wrongAnswers;
  document.getElementById("time-played").textContent = `${timePlayed}s`;
  document.getElementById("accuracy").textContent = `${accuracy}%`;

  // Prepare game data for saving
  const gameData = {
    score: gameState.score,
    correct_answers: gameState.correctAnswers,
    wrong_answers: gameState.wrongAnswers,
    total_questions: totalQuestions,
    duration: timePlayed,
    level_reached: gameState.level,
    completed: gameState.lives > 0,
  };

  // Save game to backend
  saveGameToBackend(gameData)
    .then((saved) => {
      if (saved) {
        console.log("Game history saved successfully");
      } else {
        console.warn("Failed to save game history");
      }
    })
    .catch((error) => {
      console.error("Error saving game history:", error);
    });

  // Show game over modal
  document.getElementById("game-over-modal").classList.remove("hidden");
}

// Save Game to Backend
async function saveGameToBackend(gameData) {
  try {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const token = localStorage.getItem("token");

    if (!token || !userData || !userData.user) {
      console.warn("No authentication data found");
      return false;
    }

    const gamePayload = {
      user_id: userData.user.id,
      score: gameData.score || 0,
      level: gameData.level || gameState.level || 1,
      correct_answers: gameData.correct_answers || 0,
      wrong_answers: gameData.wrong_answers || 0,
      time_played: gameData.duration || 0,
      completed: gameData.total_questions > 0,
      game_date: new Date().toISOString(),
    };

    console.log("Saving game data:", gamePayload);

    const response = await fetch(`${API_BASE_URL}/api/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(gamePayload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Game saved successfully:", result);

      // Check for achievements
      checkAchievements(gameData);
      return true;
    } else {
      const errorText = await response.text();
      console.error("Failed to save game:", response.statusText, errorText);
      return false;
    }
  } catch (error) {
    console.error("Error saving game:", error);
    return false;
  }
}

// Check Achievements
function checkAchievements(gameData) {
  const achievements = [];

  // First game achievement
  if (gameData.correct_answers >= 1) {
    achievements.push({
      name: "Primer Paso",
      description: "Responde tu primera pregunta correctamente",
    });
  }

  // Perfect score achievement
  if (gameData.wrong_answers === 0 && gameData.correct_answers >= 5) {
    achievements.push({
      name: "Perfección",
      description: "Completa 5 preguntas sin errores",
    });
  }

  // High score achievement
  if (gameData.score >= 500) {
    achievements.push({
      name: "Puntuación Alta",
      description: "Alcanza 500 puntos en una partida",
    });
  }

  // Speed achievement
  if (gameData.duration <= 120 && gameData.correct_answers >= 10) {
    achievements.push({
      name: "Velocidad Mental",
      description: "Responde 10 preguntas en menos de 2 minutos",
    });
  }

  // Show achievements
  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      showAchievementNotification(achievement.name, achievement.description);
    }, index * 2000);
  });
}

// Show Achievement Notification
function showAchievementNotification(title, description) {
  const notification = document.getElementById("achievement-notification");
  const nameElement = document.getElementById("achievement-name");

  nameElement.textContent = `${title}: ${description}`;
  notification.classList.remove("hidden");

  // Hide after 4 seconds
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 4000);
}

// Loading and Initialization
function showLoadingScreen() {
  document.getElementById("loading-screen").classList.remove("hidden");
  document.getElementById("game-container").classList.add("hidden");
}

function hideLoadingScreen() {
  document.getElementById("loading-screen").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");
}

// Joystick Functions
function showJoystickModal() {
  document.getElementById("joystick-modal").classList.remove("hidden");
}

function hideJoystickModal() {
  document.getElementById("joystick-modal").classList.add("hidden");
}

async function connectJoystick() {
  // Check if Web Serial API is available
  if (!('serial' in navigator)) {
    alert('La API Serial no está disponible en este navegador. Usa Chrome o Edge.');
    return;
  }
  
  try {
    // Request port directly using native browser selector
    const port = await navigator.serial.requestPort();
    
    // Open the port
    await port.open({ baudRate: 9600 });
    
    joystickState.port = port;
    joystickState.connected = true;
    
    // Update UI
    updateConnectionStatus(true);
    
    // Start reading data
    readJoystickData();
    
    console.log('Joystick conectado exitosamente');
    alert('¡Joystick conectado exitosamente!');
  } catch (error) {
    console.error('Error al conectar joystick:', error);
    if (error.name === 'NotFoundError') {
      // User cancelled the selection
      console.log('Selección de puerto cancelada por el usuario');
    } else {
      alert('Error al conectar con el joystick. Verifica la conexión.');
    }
  }
}

async function disconnectJoystick() {
  if (joystickState.connected && joystickState.port) {
    try {
      if (joystickState.reader) {
        await joystickState.reader.cancel();
        joystickState.reader = null;
      }
      
      await joystickState.port.close();
      joystickState.port = null;
      joystickState.connected = false;
      
      // Update UI
      updateConnectionStatus(false);
      
      console.log('Joystick desconectado');
    } catch (error) {
      console.error('Error al desconectar joystick:', error);
    }
  }
}

function updateConnectionStatus(connected) {
  const statusText = document.getElementById("connection-status");
  const indicator = document.getElementById("connection-indicator");
  const connectBtn = document.getElementById("connect-joystick");
  const disconnectBtn = document.getElementById("disconnect-joystick");
  
  if (connected) {
    statusText.textContent = "Conectado";
    indicator.className = "indicator connected";
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
  } else {
    statusText.textContent = "Desconectado";
    indicator.className = "indicator disconnected";
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  }
}

async function readJoystickData() {
  if (!joystickState.port || !joystickState.connected) return;
  
  try {
    const reader = joystickState.port.readable.getReader();
    joystickState.reader = reader;
    
    let buffer = '';
    
    while (joystickState.connected) {
      const { value, done } = await reader.read();
      
      if (done) break;
      
      // Convert bytes to string
      const text = new TextDecoder().decode(value);
      buffer += text;
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      for (const line of lines) {
        processJoystickData(line.trim());
      }
    }
  } catch (error) {
    console.error('Error al leer datos del joystick:', error);
    if (joystickState.connected) {
      disconnectJoystick();
    }
  }
}

function processJoystickData(data) {
  // Parse Arduino data: "X: 512 | Y: 512 | SW: LIBRE"
  const xMatch = data.match(/X: (\d+)/);
  const yMatch = data.match(/Y: (\d+)/);
  const swMatch = data.match(/SW: (\w+)/);
  
  if (xMatch && yMatch && swMatch) {
    const x = parseInt(xMatch[1]);
    const y = parseInt(yMatch[1]);
    const buttonPressed = swMatch[1] === "PRESIONADO";
    
    // Handle button press (toggle pause)
    if (buttonPressed && joystickState.lastButtonState === 1) {
      togglePause();
    }
    joystickState.lastButtonState = buttonPressed ? 0 : 1;
    
    // Handle joystick movement
    updatePlayerFromJoystick(x, y);
  }
}

function updatePlayerFromJoystick(x, y) {
  // Reset all movement keys
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
  
  // Calculate movement based on joystick position
  const deltaX = x - joystickState.centerX;
  const deltaY = y - joystickState.centerY;
  
  // Apply deadzone
  if (Math.abs(deltaX) > joystickState.deadzone) {
    if (deltaX > 0) {
      keys.right = true;
    } else {
      keys.left = true;
    }
  }
  
  if (Math.abs(deltaY) > joystickState.deadzone) {
    if (deltaY > 0) {
      keys.down = true;
    } else {
      keys.up = true;
    }
  }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("user"));

  if (
    !token ||
    !userData ||
    !userData.user ||
    userData.user.role !== "student"
  ) {
    alert("Debes iniciar sesión como estudiante para jugar");
    window.location.href = "index.html";
    return;
  }

  // Show loading screen
  showLoadingScreen();

  // Simulate loading time
  setTimeout(() => {
    hideLoadingScreen();
    initGame();
  }, 2000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (joystickState.connected) {
    disconnectJoystick();
  }
});
