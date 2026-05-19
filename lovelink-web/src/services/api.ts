import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ====== AUTH ======
export const authApi = {
  login: (email: string, senha: string) =>
    api.post('/auth/login', { email, senha }),
  register: (data: { nome: string; email: string; senha: string; perfil: string; id_secretaria?: number | null }) =>
    api.post('/auth/register', data),
};

// ====== USERS ======
export const usersApi = {
  list: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ====== SECRETARIAS ======
export const secretariasApi = {
  list: () => api.get('/secretarias'),
  getById: (id: number) => api.get(`/secretarias/${id}`),
  create: (data: { nome: string; email_contato: string; sigla: string }) =>
    api.post('/secretarias', data),
  update: (id: number, data: { nome: string; email_contato: string; sigla: string }) =>
    api.put(`/secretarias/${id}`, data),
  delete: (id: number) => api.delete(`/secretarias/${id}`),
};

// ====== PROJETOS ======
export const projetosApi = {
  list: () => api.get('/projetos'),
  getById: (id: number) => api.get(`/projetos/${id}`),
  create: (data: {
    nome: string; objetivo: string; prazo: string;
    custo_previsto: number; id_responsavel: number; id_secretaria: number;
  }) => api.post('/projetos', data),
  update: (id: number, data: any) => api.put(`/projetos/${id}`, data),
  delete: (id: number) => api.delete(`/projetos/${id}`),
  registrarDecisao: (id: number, data: { tipo_decisao: string; observacoes: string; id_gestor: number }) =>
    api.put(`/projetos/${id}/decisao`, data),
};

// ====== DECISOES ======
export const decisoesApi = {
  listByProjeto: (idProjeto: number) => api.get(`/projetos/${idProjeto}/decisoes`),
  listAll: () => api.get('/decisoes'),
};

// ====== ETAPAS ======
export const etapasApi = {
  listByProjeto: (idProjeto: number) => api.get(`/projetos/${idProjeto}/etapas`),
  create: (idProjeto: number, data: any) => api.post(`/projetos/${idProjeto}/etapas`, data),
  update: (idEtapa: number, data: any) => api.put(`/etapas/${idEtapa}`, data),
  delete: (idEtapa: number) => api.delete(`/etapas/${idEtapa}`),
};

export default api;
