checkAuth();
const session = JSON.parse(sessionStorage.getItem("activeUser"));
const imageForm = document.getElementById("imageForm");
const imageUrl = document.getElementById("imageUrl");
const imageContainer = document.getElementById("imageContainer");

function renderImages() {
  imageContainer.innerHTML = "";
  let users = JSON.parse(localStorage.getItem("users")) || []; // LEE DE LOCALSTORAGE
  const isAdmin = session.role === "admin";
  
  let imagesToShow = [];
  
  if (isAdmin) {
    // Admin ve todas las imágenes
    users.forEach(user => {
      user.images.forEach((img, index) => {
        imagesToShow.push({
          url: img.url,
          owner: user.email,
          userIndex: users.findIndex(u => u.email === user.email),
          imageIndex: index,
          timestamp: img.timestamp || new Date().toISOString()
        });
      });
    });
  } else {
    // Usuario normal ve solo sus imágenes
    session.images.forEach((img, index) => {
      imagesToShow.push({
        url: img.url,
        owner: session.email,
        userIndex: users.findIndex(u => u.email === session.email),
        imageIndex: index,
        timestamp: img.timestamp || new Date().toISOString()
      });
    });
  }

  // Ordenar por timestamp descendente
  imagesToShow.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  imagesToShow.forEach((img) => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-3";
    col.innerHTML = `
      <div class="card">
        <img src="${img.url}" id="images" alt="imagen" style="height: 200px; object-fit: cover;" 
             onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+no+disponible'">
        <div class="card-body">
          <p class="card-text">
            <small class="text">
              ${isAdmin ? `Subida por: ${img.owner}<br>` : ''}
              ${new Date(img.timestamp).toLocaleString()}
            </small>
          </p>
          <div class="d-grid">
            <button class="btn btn-danger btn-sm" onclick="deleteImage(${img.userIndex}, ${img.imageIndex})">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    `;
    imageContainer.appendChild(col);
  });

  // Mostrar mensaje si no hay imágenes
  if (imagesToShow.length === 0) {
    imageContainer.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center">
          <h5>No hay imágenes disponibles</h5>
          <p>¡Agrega tu primera imagen usando el formulario de arriba!</p>
        </div>
      </div>
    `;
  }
}

function deleteImage(userIndex, imageIndex) {
  if (confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const targetUser = users[userIndex];
    
    // Eliminar la imagen
    targetUser.images.splice(imageIndex, 1);
    
    // Crear log
    const log = {
      user: session.email,
      timestamp: new Date().toISOString(),
      action: session.role === "admin" && targetUser.email !== session.email 
        ? `Eliminó una imagen de ${targetUser.email}` 
        : "Eliminó una imagen"
    };
    targetUser.logs.push(log);
    
    // Actualizar localStorage
    localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
    
    // Actualizar sesión si es el mismo usuario
    if (targetUser.email === session.email) {
      sessionStorage.setItem("activeUser", JSON.stringify(targetUser));
    }
    
    renderImages();
  }
}

// Validar URL de imagen
function isValidImageUrl(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const hasValidExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  // También permitir URLs de servicios comunes de imágenes
  const imageServices = ['imgur.com', 'cloudinary.com', 'unsplash.com', 'pexels.com', 'pixabay.com'];
  const hasValidService = imageServices.some(service => 
    url.toLowerCase().includes(service)
  );
  
  return hasValidExtension || hasValidService || url.startsWith('data:image/');
}

// Manejar envío del formulario
imageForm.addEventListener("submit", function(e) {
  e.preventDefault();
  
  const url = imageUrl.value.trim();
  
  if (url === "") {
    alert("Por favor, ingresa una URL de imagen.");
    return;
  }
  
  // Validar que sea una URL válida
  try {
    new URL(url);
  } catch {
    alert("Por favor, ingresa una URL válida.");
    return;
  }
  
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUserIndex = users.findIndex(u => u.email === session.email);
  
  if (currentUserIndex !== -1) {
    // Verificar si la imagen ya existe para este usuario
    const imageExists = users[currentUserIndex].images.some(img => img.url === url);
    if (imageExists) {
      alert("Esta imagen ya está en tu galería.");
      return;
    }
    
    // Crear nueva imagen
    const newImage = {
      url: url,
      timestamp: new Date().toISOString()
    };
    
    users[currentUserIndex].images.push(newImage);
    
    // Crear log
    const log = {
      user: session.email,
      timestamp: new Date().toISOString(),
      action: "Agregó una imagen"
    };
    users[currentUserIndex].logs.push(log);
    
    // Actualizar localStorage
    localStorage.setItem("users", JSON.stringify(users)); // SE GUARDA EN LOCALSTORAGE
    
    // Actualizar sesión
    sessionStorage.setItem("activeUser", JSON.stringify(users[currentUserIndex]));
    
    // Limpiar formulario
    imageUrl.value = "";
    
    // Volver a renderizar
    renderImages();
    
    // Mostrar mensaje de éxito
    alert("Imagen agregada correctamente.");
  }
});

// Renderizar imágenes al cargar la página
renderImages();
