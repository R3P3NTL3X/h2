// Configuración de la API
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  TIMEOUT: 5000
};

// Clase para manejar la API
class APIManager {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado tiempo');
      }
      
      // Fallback a localStorage si la API no está disponible
      console.warn('API no disponible, usando localStorage:', error.message);
      // ESTE ES EL PUNTO CLAVE: SI LA API FALLA, SE USA LOCALSTORAGE
      return this.fallbackToLocalStorage(endpoint, options);
    }
  }

  fallbackToLocalStorage(endpoint, options) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const method = options.method || 'GET';
    const data = options.body ? JSON.parse(options.body) : null;

    // Simular respuestas de API usando localStorage
    switch (true) {
      case endpoint.includes('/users') && method === 'GET':
        return { success: true, data: users };
      
      case endpoint.includes('/users') && method === 'POST':
        return this.createUserLocally(data);
      
      case endpoint.includes('/users') && method === 'PUT':
        return this.updateUserLocally(data);
      
      default:
        throw new Error('Endpoint no soportado en modo offline');
    }
  }

  createUserLocally(userData) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userExists = users.find(u => u.email === userData.email);
    
    if (userExists) {
      throw new Error('El usuario ya existe');
    }

    const newUser = {
      ...userData,
      id: Date.now(),
      logs: userData.logs || [],
      notes: userData.notes || [],
      images: userData.images || []
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users)); // SE GUARDA EN LOCALSTORAGE
    
    return { success: true, data: newUser };
  }

  updateUserLocally(userData) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.email === userData.email);
    
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }

    users[userIndex] = { ...users[userIndex], ...userData };
    localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
    
    return { success: true, data: users[userIndex] };
  }
}

// Instancia global de API Manager
const apiManager = new APIManager();

function checkAuth(requiredRole = null) {
  const session = sessionStorage.getItem("activeUser");
  
  if (!session) {
    alert("Debes iniciar sesión para acceder a esta página.");
    window.location.href = "login.html";
    return false;
  }

  try {
    const user = JSON.parse(session);
    
    if (!user.email || !user.role) {
      sessionStorage.removeItem("activeUser");
      sessionStorage.removeItem("authToken");
      alert("Sesión inválida. Por favor, inicia sesión nuevamente.");
      window.location.href = "login.html";
      return false;
    }
    
    if (requiredRole && user.role !== requiredRole) {
      alert("No tienes permisos para acceder a esta página.");
      window.location.href = "profile.html";
      return false;
    }
    
    // Verificar que el usuario aún existe
    return verifyUserExists(user.email);
    
  } catch (error) {
    sessionStorage.removeItem("activeUser");
    sessionStorage.removeItem("authToken");
    alert("Error en la sesión. Por favor, inicia sesión nuevamente.");
    window.location.href = "login.html";
    return false;
  }
}

async function verifyUserExists(email) {
  try {
    // Verificar en localStorage como fallback
    const users = JSON.parse(localStorage.getItem("users")) || []; // LEE DE LOCALSTORAGE
    const userExists = users.find(u => u.email === email);
    
    if (!userExists) {
      sessionStorage.removeItem("activeUser");
      sessionStorage.removeItem("authToken");
      alert("Tu cuenta ya no existe. Por favor, regístrate nuevamente.");
      window.location.href = "login.html";
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verificando usuario:', error);
    return true; // Permitir continuar en caso de error
  }
}

function getCurrentUser() {
  const session = sessionStorage.getItem("activeUser");
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch (error) {
    console.error('Error parsing user session:', error);
    return null;
  }
}

function updateUserSession(updatedUser) {
  try {
    sessionStorage.setItem("activeUser", JSON.stringify(updatedUser));
    return true;
  } catch (error) {
    console.error("Error actualizando sesión:", error);
    return false;
  }
}

async function updateUserData(userData) {
  try {
    const response = await apiManager.request('/users', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });

    if (response.success) {
      updateUserSession(response.data);
      return response.data;
    }
    
    throw new Error('Error actualizando datos del usuario');
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

function logout() {
  const user = getCurrentUser();
  
  if (user) {
    const logoutLog = {
      user: user.email,
      timestamp: new Date().toISOString(),
      action: "Cerró sesión"
    };
    
    // Actualizar logs localmente
    let users = JSON.parse(localStorage.getItem("users")) || []; // LEE DE LOCALSTORAGE
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex !== -1) {
      users[userIndex].logs.push(logoutLog);
      localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
    }

    // También intentar actualizar en la API
    apiManager.request('/users/logout', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, log: logoutLog })
    }).catch(error => {
      console.warn('Error logging out on server:', error);
    });
  }
  
  sessionStorage.removeItem("activeUser");
  sessionStorage.removeItem("authToken");
  window.location.href = "login.html";
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

// Función para sincronizar datos con la API
async function syncUserData() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const response = await apiManager.request(`/users/${user.email}`);
    if (response.success && response.data) {
      updateUserSession(response.data);
      
      // También actualizar localStorage para consistencia
      let users = JSON.parse(localStorage.getItem("users")) || [];
      const userIndex = users.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        users[userIndex] = response.data;
        localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
      }
    }
  } catch (error) {
    console.warn('No se pudo sincronizar con el servidor:', error.message);
  }
}

// Función para exportar datos a JSON
function exportUserData() {
  const user = getCurrentUser();
  if (!user) {
    alert('No hay usuario logueado');
    return;
  }

  const dataToExport = {
    userData: user,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const dataStr = JSON.stringify(dataToExport, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `bytecore_data_${user.email}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}

// Función para importar datos desde JSON
function importUserData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.userData || !importedData.userData.email) {
          reject(new Error('Formato de archivo inválido'));
          return;
        }
        
        // Actualizar datos del usuario actual
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.email === importedData.userData.email) {
          updateUserSession(importedData.userData);
          
          // Actualizar localStorage
          let users = JSON.parse(localStorage.getItem("users")) || [];
          const userIndex = users.findIndex(u => u.email === currentUser.email);
          if (userIndex !== -1) {
            users[userIndex] = importedData.userData;
            localStorage.setItem("users", JSON.stringify(users)); // SE ACTUALIZA EN LOCALSTORAGE
          }
          
          resolve(importedData.userData);
        } else {
          reject(new Error('Los datos importados no corresponden al usuario actual'));
        }
      } catch (error) {
        reject(new Error('Error al procesar el archivo JSON'));
      }
    };
    
    reader.onerror = function() {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file);
  });
}

// Auto-sincronización cada 5 minutos si hay conexión
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (navigator.onLine && getCurrentUser()) {
      syncUserData();
    }
  }, 5 * 60 * 1000);
}

// Exponer funciones globalmente
window.apiManager = apiManager;
window.exportUserData = exportUserData;
window.importUserData = importUserData;
