export const environment = {
  production: false,
  /** Rotas de auth (login/register/forgot-password) — ficam FORA do prefixo /api no backend. */
  apiUrl: 'http://localhost:8000',
  /** Todo o resto do CRUD, protegido por auth:sanctum. */
  apiBaseUrl: 'http://localhost:8000/api',
};
