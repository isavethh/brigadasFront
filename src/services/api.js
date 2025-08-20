const API_BASE = process.env.REACT_APP_API_URL || 'https://fomulario-brigadasapi.onrender.com';

// Request sin autenticación (para brigadas)
const publicRequest = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Request con autenticación (para admin)
const authRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};

// Servicios públicos (accesibles sin login)
export const getInventory = () => {
    return publicRequest('/api/inventario');
};

// Servicios de Brigadas (públicos)
export const createBrigada = (data) => {
    return publicRequest('/api/brigadas', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateBrigada = (id, data) => {
    return publicRequest(`/api/brigadas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const upsertEppRopa = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/epp-ropa`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const upsertBotas = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/botas`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const upsertGuantes = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/guantes`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const addEppEquipoItem = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/epp-equipo`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const addHerramientaItem = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/herramientas`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const addLogisticaRepuesto = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/logistica-repuestos`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const addAlimentacionItem = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/alimentacion`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const addLogisticaCampoItem = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/logistica-campo`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const addLimpiezaPersonalItem = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/limpieza-personal`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const addLimpiezaGeneralItem = (id, data) => {
  return publicRequest(`/api/brigadas/${id}/limpieza-general`, {
    method: 'POST',
        body: JSON.stringify(data),
});
};

export const addMedicamentoItem = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/medicamentos`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const addRescateAnimalItem = (id, data) => {
    return publicRequest(`/api/brigadas/${id}/rescate-animal`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

// Servicios protegidos (solo para admin)
export const getInventoryCategories = () => {
    return authRequest('/api/admin/inventario/categorias');
};

export const createInventoryItem = (data) => {
    return authRequest('/api/admin/inventario', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateInventoryItem = (id, data) => {
    return authRequest(`/api/admin/inventario/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteInventoryItem = (id) => {
    return authRequest(`/api/admin/inventario/${id}`, {
        method: 'DELETE',
    });
};

export const getBrigadas = () => {
    return authRequest('/api/admin/brigadas');
};

export const getBrigadaPDF = (id) => {
    return authRequest(`/api/admin/brigadas/${id}/pdf`, {
        responseType: 'blob'
    });
};

// Servicios de autenticación
export const login = async (credentials) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error en login');
    }

    return response.json();
};

// Utilidades de autenticación
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getToken = () => {
    return localStorage.getItem('token');
};

// Función para verificar si el usuario está autenticado como admin
export const isAdminAuthenticated = () => {
    const token = getToken();
    const user = getCurrentUser();
    return !!(token && user && user.role === 'encargado');
};