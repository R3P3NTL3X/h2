checkAuth();
const session = JSON.parse(sessionStorage.getItem("activeUser"));
const noteForm = document.getElementById("noteForm");
const noteText = document.getElementById("noteText");
const notesList = document.getElementById("notesList");

function renderNotes() {
  notesList.innerHTML = "";
  let users = JSON.parse(localStorage.getItem("users")) || []; // LEE DE LOCALSTORAGE
  const isAdmin = session.role === "admin";
  
  let notesToShow = [];
  
  if (isAdmin) {
    // Admin ve todas las notas
    users.forEach(user => {
      user.notes.forEach((note, index) => {
        notesToShow.push({
          text: note.text,
          owner: user.email,
          userIndex: users.findIndex(u => u.email === user.email),
          noteIndex: index,
          timestamp: note.timestamp || new Date().toISOString()
        });
      });
    });
  } else {
    // Usuario normal ve solo sus notas
    session.notes.forEach((note, index) => {
      notesToShow.push({
        text: note.text,
        owner: session.email,
        userIndex: users.findIndex(u => u.email === session.email),
        noteIndex: index,
        timestamp: note.timestamp || new Date().toISOString()
      });
    });
  }

  // Ordenar por timestamp descendente
  notesToShow.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  notesToShow.forEach((note, displayIndex) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <p class="mb-1">${note.text}</p>
          <small class="text-muted">
            ${isAdmin ? `Por: ${note.owner} - ` : ''}
            ${new Date(note.timestamp).toLocaleString()}
          </small>
        </div>
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-warning" onclick="editNote(${note.userIndex}, ${note.noteIndex})">
            Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.userIndex}, ${note.noteIndex})">
            Eliminar
          </button>
        </div>
      </div>
    `;
    notesList.appendChild(li);
  });
}

function deleteNote(userIndex, noteIndex) {
  if (confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const targetUser = users[userIndex];
    
    // Eliminar la nota
    targetUser.notes.splice(noteIndex, 1);
    
    // Crear log
    const log = {
      user: session.email,
      timestamp: new Date().toISOString(),
      action: session.role === "admin" && targetUser.email !== session.email 
        ? `Eliminó una nota de ${targetUser.email}` 
        : "Eliminó una nota"
    };
    targetUser.logs.push(log);
    
    // Actualizar localStorage
    localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
    
    // Actualizar sesión si es el mismo usuario
    if (targetUser.email === session.email) {
      sessionStorage.setItem("activeUser", JSON.stringify(targetUser));
    }
    
    renderNotes();
  }
}

function editNote(userIndex, noteIndex) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const targetUser = users[userIndex];
  const note = targetUser.notes[noteIndex];
  
  const nuevoTexto = prompt("Editar nota:", note.text);
  if (nuevoTexto !== null && nuevoTexto.trim() !== "") {
    // Actualizar la nota
    targetUser.notes[noteIndex].text = nuevoTexto.trim();
    targetUser.notes[noteIndex].timestamp = new Date().toISOString();
    
    // Crear log
    const log = {
      user: session.email,
      timestamp: new Date().toISOString(),
      action: session.role === "admin" && targetUser.email !== session.email 
        ? `Editó una nota de ${targetUser.email}` 
        : "Editó una nota"
    };
    targetUser.logs.push(log);
    
    // Actualizar localStorage
    localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
    
    // Actualizar sesión si es el mismo usuario
    if (targetUser.email === session.email) {
      sessionStorage.setItem("activeUser", JSON.stringify(targetUser));
    }
    
    renderNotes();
  }
}

// Manejar envío del formulario
noteForm.addEventListener("submit", function(e) {
  e.preventDefault();
  
  if (noteText.value.trim() === "") {
    alert("Por favor, escribe una nota antes de guardar.");
    return;
  }
  
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUserIndex = users.findIndex(u => u.email === session.email);
  
  if (currentUserIndex !== -1) {
    // Crear nueva nota
    const newNote = {
      text: noteText.value.trim(),
      timestamp: new Date().toISOString()
    };
    
    users[currentUserIndex].notes.push(newNote);
    
    // Crear log
    const log = {
      user: session.email,
      timestamp: new Date().toISOString(),
      action: "Agregó una nota"
    };
    users[currentUserIndex].logs.push(log);
    
    // Actualizar localStorage
    localStorage.setItem("users", JSON.stringify(users)); // SE GUARDA EN LOCALSTORAGE
    
    // Actualizar sesión
    sessionStorage.setItem("activeUser", JSON.stringify(users[currentUserIndex]));
    
    // Limpiar formulario
    noteText.value = "";
    
    // Volver a renderizar
    renderNotes();
  }
});

// Renderizar notas al cargar la página
renderNotes();
