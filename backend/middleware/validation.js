const { body, param, validationResult } = require("express-validator");

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

// Validaciones para registro de usuario
const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("email")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El email no puede exceder 255 caracteres"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),

  body("role")
    .optional()
    .isIn(["student", "teacher"])
    .withMessage('El rol debe ser "student" o "teacher"'),

  handleValidationErrors,
];

// Validaciones para login
const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("La contraseña es requerida"),

  handleValidationErrors,
];

// Validaciones para actualizar usuario
const validateUpdateUser = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El email no puede exceder 255 caracteres"),

  handleValidationErrors,
];

// Validaciones para actualizar usuario por ID
const validateUpdateUserById = [
  param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El email no puede exceder 255 caracteres"),

  handleValidationErrors,
];

// Validaciones para crear partida
const validateCreateGame = [
  body("user_id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),

  body("score")
    .isInt({ min: 0 })
    .withMessage("El puntaje debe ser un número entero positivo"),

  body("correct_answers")
    .isInt({ min: 0 })
    .withMessage(
      "Las respuestas correctas deben ser un número entero positivo"
    ),

  body("wrong_answers")
    .isInt({ min: 0 })
    .withMessage(
      "Las respuestas incorrectas deben ser un número entero positivo"
    ),

  body("total_questions")
    .isInt({ min: 1 })
    .withMessage("El total de preguntas debe ser al menos 1"),

  body("duration")
    .isInt({ min: 1 })
    .withMessage("La duración debe ser al menos 1 segundo"),

  body("questions")
    .isArray({ min: 1 })
    .withMessage("Debe incluir al menos una pregunta"),

  body("questions.*.question")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("La pregunta debe tener entre 1 y 255 caracteres"),

  body("questions.*.user_answer")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("La respuesta del usuario debe tener entre 1 y 50 caracteres"),

  body("questions.*.correct_answer")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("La respuesta correcta debe tener entre 1 y 50 caracteres"),

  body("questions.*.is_correct")
    .isBoolean()
    .withMessage("is_correct debe ser un valor booleano"),

  handleValidationErrors,
];

// Validaciones para parámetros de ID
const validateUserId = [
  param("user_id").isInt({ min: 1 }).withMessage("ID de usuario inválido"),

  handleValidationErrors,
];

const validateGameId = [
  param("game_id").isInt({ min: 1 }).withMessage("ID de partida inválido"),

  handleValidationErrors,
];

const validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),

  handleValidationErrors,
];

// Validación customizada para verificar que las respuestas coincidan con las estadísticas
const validateGameConsistency = (req, res, next) => {
  const { correct_answers, wrong_answers, total_questions, questions } =
    req.body;

  // Verificar que las sumas coincidan
  if (correct_answers + wrong_answers !== total_questions) {
    return res.status(400).json({
      success: false,
      message:
        "Las respuestas correctas + incorrectas deben sumar el total de preguntas",
    });
  }

  // Verificar que el número de preguntas coincida
  if (questions.length !== total_questions) {
    return res.status(400).json({
      success: false,
      message: "El número de preguntas debe coincidir con total_questions",
    });
  }

  // Contar respuestas correctas en el array de preguntas
  const actualCorrect = questions.filter((q) => q.is_correct).length;
  const actualWrong = questions.filter((q) => !q.is_correct).length;

  if (actualCorrect !== correct_answers || actualWrong !== wrong_answers) {
    return res.status(400).json({
      success: false,
      message:
        "Las estadísticas no coinciden con los detalles de las preguntas",
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateUpdateUserById,
  validateCreateGame,
  validateUserId,
  validateGameId,
  validateId,
  validateGameConsistency,
  handleValidationErrors,
};
