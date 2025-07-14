document.addEventListener("DOMContentLoaded", () => {
  const userWelcome = document.getElementById("userWelcome");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Cargar usuario desde sessionStorage
  const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));

  // Mostrar u ocultar según estado de sesión
  if (activeUser) {
    loginBtn.classList.add("d-none");
    logoutBtn.classList.remove("d-none");
    userWelcome.classList.remove("d-none");
    userWelcome.querySelector("b").textContent = activeUser.email.split('@')[0];
  }

  // Cerrar sesión
  logoutBtn.addEventListener("click", () => {
    // Se llama a la función global logout definida en middleware.js
    // Esto asegura que el log de cierre de sesión se guarde en localStorage
    // antes de limpiar sessionStorage y redirigir.
    logout(); 
  });
});
