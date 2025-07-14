checkAuth();
const user = JSON.parse(sessionStorage.getItem("activeUser"));
const fields = ['name', 'email', 'phone', 'country', 'city', 'address', 'zip'];

// Llenar campos del formulario
fields.forEach(field => {
  document.getElementById(field).value = user[field] || '';
});

// Manejar envío del formulario
document.getElementById("profileForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const updatedUser = { ...user };
  fields.forEach(field => {
    if (field !== 'email') {
      updatedUser[field] = document.getElementById(field).value;
    }
  });

  // Crear log de actualización de perfil
  const log = {
    user: updatedUser.email,
    timestamp: new Date().toISOString(),
    action: "Actualizó su perfil"
  };
  updatedUser.logs.push(log);

  // Actualizar en localStorage
  let users = JSON.parse(localStorage.getItem("users")) || []; // LEE DE LOCALSTORAGE
  const index = users.findIndex(u => u.email === updatedUser.email);
  if (index !== -1) {
    users[index] = updatedUser;
  }
  localStorage.setItem("users", JSON.stringify(users)); // SE GUARDA EN LOCALSTORAGE
  
  // Actualizar sesión
  sessionStorage.setItem("activeUser", JSON.stringify(updatedUser));
  
  // Mostrar mensaje de éxito
  alert("Perfil actualizado correctamente");
  
  // Redirigir a página principal
  window.location.href = "inicio.html";
});

// Manejar cierre de sesión
document.getElementById("logout").addEventListener("click", function() {
  // Crear log de cierre de sesión
  const logoutLog = {
    user: user.email,
    timestamp: new Date().toISOString(),
    action: "Cerró sesión"
  };
  
  let users = JSON.parse(localStorage.getItem("users")) || []; // LEE DE LOCALSTORAGE
  const userIndex = users.findIndex(u => u.email === user.email);
  if (userIndex !== -1) {
    users[userIndex].logs.push(logoutLog);
    localStorage.setItem("users", JSON.stringify(users)); // SE GUARDA EN LOCALSTORAGE
  }
  
  sessionStorage.removeItem("activeUser");
  window.location.href = "login.html";
});

// Mostrar logs de actividad
const logList = document.getElementById("logList");
logList.innerHTML = "";

(user.logs || []).forEach(log => {
  const li = document.createElement("li");
  li.className = "list-group-item d-flex justify-content-between align-items-center";
  li.innerHTML = `
    <div>
      <strong>${log.action}</strong>
      <br>
      <small class="text-muted">${new Date(log.timestamp).toLocaleString()}</small>
    </div>
  `;
  logList.appendChild(li);
});
