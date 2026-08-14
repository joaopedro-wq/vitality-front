import { environment } from '../../../environments/environment';

/**
 * Centraliza os endpoints do backend. `login` e `criarUsuario` foram
 * movidos no backend de `routes/auth.php` (grupo `web`, sessão + CSRF) para
 * `routes/api.php` (grupo `api`, stateless) — era a causa do "CSRF token
 * mismatch" ao criar conta. `register`/`forgotPassword`/`resetPassword`
 * continuam fora de `/api` (scaffold do Breeze, não usado por este front).
 * Usar sempre este arquivo em vez de montar strings de URL na mão nos
 * services — evita alguém esquecer o `/api` (ou colocar de mais).
 */
export const authPaths = {
  login: () => `${environment.apiBaseUrl}/login`,
  criarUsuario: () => `${environment.apiBaseUrl}/criar-usuario`,
  register: () => `${environment.apiUrl}/register`,
  forgotPassword: () => `${environment.apiUrl}/forgot-password`,
  resetPassword: () => `${environment.apiUrl}/reset-password`,
  /** Best-effort — rota de sessão do Breeze, não confiável com Bearer token. */
  logout: () => `${environment.apiUrl}/logout`,
};

export const apiPaths = {
  me: () => `${environment.apiBaseUrl}/user/get-with-token`,
  users: () => `${environment.apiBaseUrl}/users`,
  user: (id: number | string) => `${environment.apiBaseUrl}/user/${id}`,
  userAvatar: () => `${environment.apiBaseUrl}/user/avatar`,

  alimentos: () => `${environment.apiBaseUrl}/foods`,
  alimento: (id: number | string) => `${environment.apiBaseUrl}/foods/${id}`,
  gruposAlimentos: () => `${environment.apiBaseUrl}/foods/groups`,
  favoritoAlimento: (id: number | string) => `${environment.apiBaseUrl}/foods/${id}/favorite`,
  adminAlimentos: () => `${environment.apiBaseUrl}/admin/foods`,
  adminAlimento: (id: number | string) => `${environment.apiBaseUrl}/admin/foods/${id}`,
  adminArquivarAlimento: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/archive`,
  adminRestaurarAlimento: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/restore`,
  adminImportarTaco: () => `${environment.apiBaseUrl}/admin/foods/import-taco`,

  refeicoes: () => `${environment.apiBaseUrl}/refeicao`,
  refeicao: (id: number | string) => `${environment.apiBaseUrl}/refeicao/${id}`,

  dietas: () => `${environment.apiBaseUrl}/dieta`,
  dieta: (id: number | string) => `${environment.apiBaseUrl}/dieta/${id}`,

  registros: () => `${environment.apiBaseUrl}/registro`,
  registro: (id: number | string) => `${environment.apiBaseUrl}/registro/${id}`,

  diaryDay: () => `${environment.apiBaseUrl}/diary/day`,
  diaryEntries: () => `${environment.apiBaseUrl}/diary/entries`,
  diaryEntry: (id: number | string) => `${environment.apiBaseUrl}/diary/entries/${id}`,
  diaryMeals: () => `${environment.apiBaseUrl}/diary/meals`,
  diaryMeal: (id: number | string) => `${environment.apiBaseUrl}/diary/meals/${id}`,

  metas: () => `${environment.apiBaseUrl}/meta`,
  meta: (id: number | string) => `${environment.apiBaseUrl}/meta/${id}`,

  recomendacoes: () => `${environment.apiBaseUrl}/recomendacao`,
  recomendacao: (id: number | string) => `${environment.apiBaseUrl}/recomendacao/${id}`,
};
