const msg = document.getElementById("msg");
const roles = document.querySelectorAll(".roles button");
const rolesContainer = document.getElementById("rolesContainer");
let selectedRole = "student";

// Tabs
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const formLogin = document.getElementById("formLogin");
const formRegistro = document.getElementById("formRegistro");

// Configuración de la API
const API_BASE_URL = "http://localhost:3000";

// Utilidades para API
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

  saveUser(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
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

// Cambiar entre login y registro
btnLogin.addEventListener("click", () => {
  btnLogin.classList.add("active");
  btnRegister.classList.remove("active");
  formLogin.classList.add("active");
  formRegistro.classList.remove("active");
  // Ocultar roles en login
  rolesContainer.classList.add("hidden");
});

btnRegister.addEventListener("click", () => {
  btnRegister.classList.add("active");
  btnLogin.classList.remove("active");
  formRegistro.classList.add("active");
  formLogin.classList.remove("active");
  // Mostrar roles en registro
  rolesContainer.classList.remove("hidden");
});

// Selección de roles
roles.forEach((btn) => {
  btn.addEventListener("click", () => {
    roles.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRole = btn.dataset.role;
  });
});

// Login
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector(".btn-action");
  const originalText = submitBtn.textContent;

  try {
    submitBtn.textContent = "🌊 Iniciando sesión...";
    submitBtn.disabled = true;

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      showMessage("Completa todos los campos", "error");
      return;
    }

    const response = await apiUtils.makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success) {
      apiUtils.saveUser(response.data);
      showMessage(`✅ ¡Bienvenido ${response.data.user.name}!`, "success");

      // Redirigir según el rol
      setTimeout(() => {
        if (response.data.user.role === "teacher") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "student.html";
        }
      }, 1500);
    }
  } catch (error) {
    showMessage(`❌ ${error.message}`, "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Registro
formRegistro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector(".btn-action");
  const originalText = submitBtn.textContent;

  try {
    submitBtn.textContent = "🌟 Registrando...";
    submitBtn.disabled = true;

    const name = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    const email = document.getElementById("email").value.trim();

    if (!name || !password || !confirm || !email) {
      showMessage("Todos los campos son obligatorios", "error");
      return;
    }

    if (password !== confirm) {
      showMessage("Las contraseñas no coinciden", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    const response = await apiUtils.makeRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        role: selectedRole,
      }),
    });

    if (response.success) {
      apiUtils.saveUser(response.data);
      showMessage(
        `🎉 ¡Registro exitoso! Bienvenido ${response.data.user.name}`,
        "success"
      );

      // Limpiar formulario
      formRegistro.reset();

      // Redirigir según el rol
      setTimeout(() => {
        if (response.data.user.role === "teacher") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "student.html";
        }
      }, 1500);
    }
  } catch (error) {
    showMessage(`❌ ${error.message}`, "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

function showMessage(text, type) {
  msg.textContent = text;
  msg.style.color = type === "success" ? "#00ffcc" : "#ff6666";
}

// Verificar autenticación al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  // Ocultar roles por defecto (página inicia en login)
  rolesContainer.classList.add("hidden");
  
  if (apiUtils.isLoggedIn()) {
    try {
      // Verificar si el token sigue siendo válido
      const response = await apiUtils.makeRequest("/auth/verify");

      if (response.success) {
        const user = apiUtils.getUser();

        // Redirigir según el rol
        if (user.user.role === "teacher") {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "student.html";
        }
      }
    } catch (error) {
      // Token inválido, limpiar datos
      apiUtils.clearUser();
    }
  }
});

// Generar burbujas
function crearBurbuja() {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  const size = Math.random() * 20 + 10;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;

  // Asegurar que las burbujas estén dentro del viewport
  const maxLeft = window.innerWidth - size - 20; // 20px de margen
  bubble.style.left = `${Math.random() * maxLeft}px`;

  document.body.appendChild(bubble);
  setTimeout(() => {
    if (bubble.parentNode) {
      bubble.remove();
    }
  }, 8000);
}

// Crear burbujas con menos frecuencia en móviles para mejor performance
const isMobile = window.innerWidth <= 768;
setInterval(crearBurbuja, isMobile ? 2000 : 1000);
