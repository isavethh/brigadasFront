import axios from 'axios';

// Cliente Axios centralizado
// Usa la variable de entorno REACT_APP_API_BASE_URL para configurar el host de la API.
// Ejemplo: REACT_APP_API_BASE_URL=https://mi-dominio.com/api
export const apiClient = axios.create({
    baseURL: 'https://fomulario-brigadasapi.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor simple para logging de errores (opcional)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Propaga el error tal cual, pero deja trazas claras en consola
        // para facilitar debugging en desarrollo.
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error('API error:', error?.response || error);
        }
        return Promise.reject(error);
    }
);

// ====================
// BRIGADA
// ====================
export const createBrigada = (payload) => apiClient.post('/brigada', payload);
export const getBrigada = (brigadaId) => apiClient.get(`/brigada/${brigadaId}`);
export const updateBrigada = (brigadaId, payload) => apiClient.put(`/brigada/${brigadaId}`, payload);
export const listBrigadas = () => apiClient.get('/brigada');

// ====================
// EPP ROPA
// ====================
export const upsertEppRopa = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/epp-ropa`, payload);
export const getEppRopa = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/epp-ropa`);
export const deleteEppRopaItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/epp-ropa/${itemId}`);

// ====================
// BOTAS
// ====================
export const upsertBotas = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/botas`, payload);
export const getBotas = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/botas`);

// ====================
// GUANTES
// ====================
export const upsertGuantes = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/guantes`, payload);
export const getGuantes = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/guantes`);

// ====================
// EPP EQUIPO
// ====================
export const addEppEquipoItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/epp-equipo`, payload);
export const getEppEquipo = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/epp-equipo`);
export const deleteEppEquipoItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/epp-equipo/${itemId}`);

// ====================
// HERRAMIENTAS
// ====================
export const addHerramientaItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/herramientas`, payload);
export const getHerramientas = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/herramientas`);
export const deleteHerramientaItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/herramientas/${itemId}`);

// ====================
// LOGÍSTICA REPUESTOS
// ====================
export const addLogisticaRepuesto = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/logistica-repuestos`, payload);
export const getLogisticaRepuestos = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/logistica-repuestos`);
export const deleteLogisticaRepuesto = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/logistica-repuestos/${itemId}`);

// ====================
// ALIMENTACIÓN
// ====================
export const addAlimentacionItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/alimentacion`, payload);
export const getAlimentacion = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/alimentacion`);
export const deleteAlimentacionItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/alimentacion/${itemId}`);

// ====================
// LOGÍSTICA CAMPO
// ====================
export const addLogisticaCampoItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/logistica-campo`, payload);
export const getLogisticaCampo = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/logistica-campo`);
export const deleteLogisticaCampoItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/logistica-campo/${itemId}`);

// ====================
// LIMPIEZA PERSONAL
// ====================
export const addLimpiezaPersonalItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/limpieza-personal`, payload);
export const getLimpiezaPersonal = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/limpieza-personal`);
export const deleteLimpiezaPersonalItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/limpieza-personal/${itemId}`);

// ====================
// LIMPIEZA GENERAL
// ====================
export const addLimpiezaGeneralItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/limpieza-general`, payload);
export const getLimpiezaGeneral = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/limpieza-general`);
export const deleteLimpiezaGeneralItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/limpieza-general/${itemId}`);

// ====================
// MEDICAMENTOS
// ====================
export const addMedicamentoItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/medicamentos`, payload);
export const getMedicamentos = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/medicamentos`);
export const deleteMedicamentoItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/medicamentos/${itemId}`);

// ====================
// RESCATE ANIMAL
// ====================
export const addRescateAnimalItem = (brigadaId, payload) => apiClient.post(`/brigada/${brigadaId}/rescate-animal`, payload);
export const getRescateAnimal = (brigadaId) => apiClient.get(`/brigada/${brigadaId}/rescate-animal`);
export const deleteRescateAnimalItem = (brigadaId, itemId) => apiClient.delete(`/brigada/${brigadaId}/rescate-animal/${itemId}`);


