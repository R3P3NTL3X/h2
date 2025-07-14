(function() {
  // Elementos del DOM
  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const errorDiv = document.getElementById("error");
  const successDiv = document.getElementById("success");
  
  // Botones de alternancia
  const showRegisterBtn = document.getElementById("showRegister");
  const showLoginBtn = document.getElementById("showLogin");
  
  // Botones de envío
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const registerBtnText = document.getElementById("registerBtnText");
  const loginSpinner = document.getElementById("loginSpinner");
  const registerSpinner = document.getElementById("registerSpinner");

  // API Configuration
  const API_BASE = 'http://localhost:3000/api'; // Cambiar por tu API real

  // Función para hacer peticiones a la API
  async function apiRequest(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error en la petición');
      }
      
      return result;
    } catch (error) {
      console.error('API Error:', error);
      // Fallback a localStorage si la API no está disponible
      // ESTE ES EL PUNTO CLAVE: SI LA API FALLA, SE USA LOCALSTORAGE
      return handleLocalStorage(endpoint, method, data);
    }
  }

  // Fallback para localStorage cuando API no está disponible
  function handleLocalStorage(endpoint, method, data) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    
    switch (endpoint) {
      case '/users':
        if (method === 'POST') {
          // Registrar usuario
          const userExists = users.find(u => u.email === data.email);
          if (userExists) {
            // ESTE ES EL MENSAJE QUE VES: EL USUARIO YA EXISTE EN LOCALSTORAGE
            throw new Error('Ya existe una cuenta con este correo electrónico.');
          }
          
          const newUser = {
            ...data,
            id: Date.now(),
            role: "user",
            logs: [{
              user: data.email,
              timestamp: new Date().toISOString(),
              action: "Registro de cuenta"
            }],
            notes: [],
            images: []
          };
          
          users.push(newUser);
          localStorage.setItem("users", JSON.stringify(users)); // SE GUARDA EN LOCALSTORAGE
          return { success: true, user: newUser };
        }
        break;
        
      case '/auth/login':
        if (method === 'POST') {
          const user = users.find(u => u.email === data.email);
          if (!user) {
            throw new Error('No existe una cuenta con este correo electrónico.');
          }
          
          if (user.password !== data.password) {
            throw new Error('Contraseña incorrecta.');
          }
          
          // Actualizar logs
          user.logs.push({
            user: data.email,
            timestamp: new Date().toISOString(),
            action: "Inicio de sesión"
          });
          
          const userIndex = users.findIndex(u => u.email === data.email);
          users[userIndex] = user;
          localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
          
          return { success: true, user, token: 'local_token_' + Date.now() };
        }
        break;
    }
    
    throw new Error('Endpoint no encontrado');
  }

  // Crear usuario admin por defecto
  function createDefaultAdmin() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const adminExists = users.find(u => u.email === "admin@bytecore.com");
    
    if (!adminExists) {
      const adminUser = {
        id: 1,
        email: "admin@bytecore.com",
        password: "admin123",
        role: "admin",
        name: "Administrador ByteCore",
        phone: "+57 300 123 4567",
        country: "Colombia",
        city: "Medellín",
        address: "Calle 10 #20-30",
        zip: "050001",
        logs: [{
          user: "admin@bytecore.com",
          timestamp: new Date().toISOString(),
          action: "Usuario administrador creado"
        }],
        notes: [],
        images: []
      };
      users.push(adminUser);
      localStorage.setItem("users", JSON.stringify(users)); // SE GUARDA EN LOCALSTORAGE
      console.log("Usuario admin creado: admin@bytecore.com / admin123");
    }
  }

  // Mostrar mensaje de error
  function showError(message) {
    errorDiv.innerHTML = message;
    errorDiv.classList.remove("d-none");
    successDiv.classList.add("d-none");
    setTimeout(() => {
      errorDiv.classList.add("d-none");
    }, 5000);
  }

  // Mostrar mensaje de éxito
  function showSuccess(message) {
    successDiv.innerHTML = message;
    successDiv.classList.remove("d-none");
    errorDiv.classList.add("d-none");
    setTimeout(() => {
      successDiv.classList.add("d-none");
    }, 3000);
  }

  // Alternar entre login y registro
  showRegisterBtn.addEventListener("click", () => {
    loginSection.classList.add("d-none");
    registerSection.classList.remove("d-none");
    clearMessages();
  });

  showLoginBtn.addEventListener("click", () => {
    registerSection.classList.add("d-none");
    loginSection.classList.remove("d-none");
    clearMessages();
  });

  function clearMessages() {
    errorDiv.classList.add("d-none");
    successDiv.classList.add("d-none");
  }

  // Validar email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar contraseña
  function isValidPassword(password) {
    return password.length >= 6;
  }

  // Deshabilitar botón durante proceso
  function setButtonLoading(button, textElement, spinner, isLoading) {
    if (isLoading) {
      button.disabled = true;
      textElement.classList.add("d-none");
      spinner.classList.remove("d-none");
    } else {
      button.disabled = false;
      textElement.classList.remove("d-none");
      spinner.classList.add("d-none");
    }
  }

  // Manejar registro
  registerForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const name = document.getElementById("registerName").value.trim();

    // Validaciones
    if (!isValidEmail(email)) {
      showError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (!isValidPassword(password)) {
      showError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Las contraseñas no coinciden.");
      return;
    }

    if (name === "") {
      showError("Por favor, ingresa tu nombre completo.");
      return;
    }

    // Mostrar loading
    setButtonLoading(registerBtn, registerBtnText, registerSpinner, true);

    try {
      const result = await apiRequest('/users', 'POST', {
        email,
        password,
        name,
        phone: "",
        country: "",
        city: "",
        address: "",
        zip: ""
      });

      if (result.success) {
        showSuccess("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.");
        registerForm.reset();
        
        setTimeout(() => {
          registerSection.classList.add("d-none");
          loginSection.classList.remove("d-none");
          clearMessages();
        }, 2000);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setButtonLoading(registerBtn, registerBtnText, registerSpinner, false);
    }
  });

  // Manejar login
  loginForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();

    // Validaciones básicas
    if (!isValidEmail(email)) {
      showError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (password === "") {
      showError("Por favor, ingresa tu contraseña.");
      return;
    }

    // Mostrar loading
    setButtonLoading(loginBtn, loginBtnText, loginSpinner, true);

    try {
      const result = await apiRequest('/auth/login', 'POST', {
        email,
        password
      });

      if (result.success && result.user) {
        // Guardar usuario en sessionStorage
        sessionStorage.setItem("activeUser", JSON.stringify(result.user));
        sessionStorage.setItem("authToken", result.token);

        showSuccess("¡Inicio de sesión exitoso! Redirigiendo...");
        loginForm.reset();
        
        setTimeout(() => {
          window.location.href = "inicio.html";
        }, 1000);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setButtonLoading(loginBtn, loginBtnText, loginSpinner, false);
    }
  });

  // Agregar enlace de recuperación de contraseña
  function addPasswordRecoveryLink() {
    const recoveryLink = document.createElement('div');
    recoveryLink.className = 'text-center mt-2';
    recoveryLink.innerHTML = `
      <a href="#" id="forgotPassword" class="text-info">¿Olvidaste tu contraseña?</a>
    `;
    
    loginForm.appendChild(recoveryLink);
    
    document.getElementById('forgotPassword').addEventListener('click', function(e) {
      e.preventDefault();
      const email = prompt('Ingresa tu correo electrónico para recuperar la contraseña:');
      if (email && isValidEmail(email)) {
        recoverPassword(email);
      } else if (email) {
        showError('Por favor, ingresa un correo electrónico válido.');
      }
    });
  }

  // Función de recuperación de contraseña
  async function recoverPassword(email) {
    try {
      let users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find(u => u.email === email.toLowerCase());
      
      if (!user) {
        showError('No existe una cuenta con este correo electrónico.');
        return;
      }
      
      // Generar nueva contraseña temporal
      const tempPassword = 'temp' + Math.random().toString(36).substr(2, 6);
      
      // Actualizar contraseña
      user.password = tempPassword;
      user.logs.push({
        user: email,
        timestamp: new Date().toISOString(),
        action: "Recuperación de contraseña"
      });
      
      const userIndex = users.findIndex(u => u.email === email.toLowerCase());
      users[userIndex] = user;
      localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
      
      // En un sistema real, aquí enviarías un email
      showSuccess(`Nueva contraseña temporal: ${tempPassword}\n(En un sistema real se enviaría por correo)`);
      
    } catch (error) {
      showError('Error al recuperar la contraseña. Inténtalo de nuevo.');
    }
  }

  // Verificar si ya hay sesión activa
  const activeUser = sessionStorage.getItem("activeUser");
  if (activeUser) {
    window.location.href = "inicio.html";
  }

  // Inicializar
  createDefaultAdmin();
  addPasswordRecoveryLink();
  
  // Mostrar mensaje de usuario por defecto
  setTimeout(() => {
    const adminInfo = document.createElement('div');
    adminInfo.className = 'alert alert-info mt-3';
    adminInfo.innerHTML = `
      <small>
        <strong>Usuario de prueba:</strong><br>
        Email: admin@bytecore.com<br>
        Contraseña: admin123
      </small>
    `;
    document.querySelector('.auth-container').appendChild(adminInfo);
  }, 1000);
})();
