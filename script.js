const btnStudent = document.getElementById('btnStudent');
const btnTeacher = document.getElementById('btnTeacher');
const userForm = document.getElementById('userForm');
const teacherView = document.getElementById('teacherView');
const resultDiv = document.getElementById('result');

// ESTADO INICIAL: nada seleccionado
userForm.classList.add('hidden');
teacherView.classList.add('hidden');
teacherView.style.display = "none";
btnStudent.classList.remove('selected');
btnTeacher.classList.remove('selected');
resultDiv.textContent = "";

// Alternar vista Estudiante/Profesor
btnStudent.addEventListener('click', function() {
  btnStudent.classList.add('selected');
  btnTeacher.classList.remove('selected');
  userForm.classList.remove('hidden');
  teacherView.classList.add('hidden');
  teacherView.style.display = "none";
  resultDiv.textContent = "";
});

btnTeacher.addEventListener('click', function() {
  btnTeacher.classList.add('selected');
  btnStudent.classList.remove('selected');
  userForm.classList.add('hidden');
  teacherView.classList.remove('hidden');
  teacherView.style.display = "flex";
  resultDiv.textContent = "";
});

// Lógica de selección de avatar
const avatars = document.querySelectorAll('.avatar');
let selectedAvatar = null;

avatars.forEach(avatar => {
  avatar.addEventListener('click', () => {
    selectAvatar(avatar);
  });
  avatar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectAvatar(avatar);
    }
  });
});

function selectAvatar(avatar) {
  if (selectedAvatar) {
    selectedAvatar.classList.remove('selected');
  }
  avatar.classList.add('selected');
  selectedAvatar = avatar;
}

// Envío de formulario de estudiante
userForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = userForm.name.value.trim();
  const grade = userForm.grade.value;

  if (!selectedAvatar) {
    alert('Por favor, selecciona un avatar.');
    return;
  }
  if (name.length < 2) {
    alert('Por favor, ingresa un nombre válido.');
    return;
  }
  if (!grade) {
    alert('Por favor, selecciona tu grado.');
    return;
  }

  // Guarda los datos del alumno en localStorage
  localStorage.setItem("sharkyEstudiante", JSON.stringify({
    nombre: name,
    grado: grade,
    avatar: selectedAvatar.src
  }));

  // Redirige a la página del juego
  window.location.href = "juego.html";
});

// Música de fondo con dos botones y autoplay
const audio = document.getElementById('bgMusic');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');

function updateMusicButtons() {
  if (audio.paused) {
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    playBtn.classList.add('active');
    pauseBtn.classList.remove('active');
  } else {
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    playBtn.classList.remove('active');
    pauseBtn.classList.add('active');
  }
}

playBtn.addEventListener('click', () => {
  audio.play();
  updateMusicButtons();
});

pauseBtn.addEventListener('click', () => {
  audio.pause();
  updateMusicButtons();
});

audio.addEventListener('play', updateMusicButtons);
audio.addEventListener('pause', updateMusicButtons);

// Intentar autoplay al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  audio.volume = 0.7;
  let played = audio.play();
  if (played !== undefined) {
    played.then(() => {
      // Autoplay exitoso
      updateMusicButtons();
    }).catch(() => {
      // El navegador bloqueó el autoplay
      updateMusicButtons();
    });
  }
});

// Inicializar botones musicales 
updateMusicButtons();
