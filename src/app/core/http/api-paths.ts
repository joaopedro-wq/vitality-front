import { environment } from '../../../environments/environment';

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

  dashboardSummary: () => `${environment.apiBaseUrl}/dashboard/summary`,
  users: () => `${environment.apiBaseUrl}/users`,
  user: (id: number | string) => `${environment.apiBaseUrl}/user/${id}`,
  userAvatar: () => `${environment.apiBaseUrl}/user/avatar`,

  alimentos: () => `${environment.apiBaseUrl}/foods`,
  alimento: (id: number | string) => `${environment.apiBaseUrl}/foods/${id}`,
  gruposAlimentos: () => `${environment.apiBaseUrl}/foods/groups`,
  gruposNormalizadosAlimentos: () => `${environment.apiBaseUrl}/foods/groups-normalized`,
  favoritoAlimento: (id: number | string) => `${environment.apiBaseUrl}/foods/${id}/favorite`,
  adminAlimentos: () => `${environment.apiBaseUrl}/admin/foods`,
  adminAlimento: (id: number | string) => `${environment.apiBaseUrl}/admin/foods/${id}`,
  adminArquivarAlimento: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/archive`,
  adminRestaurarAlimento: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/restore`,
  adminImportarTaco: () => `${environment.apiBaseUrl}/admin/foods/import-taco`,
  adminFoodPlanTags: () => `${environment.apiBaseUrl}/admin/food-plan-tags`,
  adminFoodPlanTagsFor: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/plan-tags`,
  adminFoodRestrictions: () => `${environment.apiBaseUrl}/admin/food-restrictions`,
  adminFoodRestrictionsFor: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/restrictions`,

  refeicoes: () => `${environment.apiBaseUrl}/refeicao`,
  refeicao: (id: number | string) => `${environment.apiBaseUrl}/refeicao/${id}`,

  dietas: () => `${environment.apiBaseUrl}/dieta`,
  dieta: (id: number | string) => `${environment.apiBaseUrl}/dieta/${id}`,

  mealPlans: () => `${environment.apiBaseUrl}/meal-plans`,
  mealPlan: (id: number | string) => `${environment.apiBaseUrl}/meal-plans/${id}`,
  mealPlanProfile: () => `${environment.apiBaseUrl}/meal-plan-profile`,
  mealPlanRestrictions: () => `${environment.apiBaseUrl}/meal-plan-restrictions`,
  mealPlanPreview: () => `${environment.apiBaseUrl}/meal-plans/preview`,
  mealPlanRecreate: () => `${environment.apiBaseUrl}/meal-plans/preview/recreate`,
  mealPlanUndo: () => `${environment.apiBaseUrl}/meal-plans/preview/undo`,
  mealPlanRefreshLocale: () => `${environment.apiBaseUrl}/meal-plans/preview/refresh-locale`,
  mealPlanMealPreview: (position: number) =>
    `${environment.apiBaseUrl}/meal-plans/preview/meal/${position}`,
  mealPlanItemSuggestions: (position: number, foodId: number) =>
    `${environment.apiBaseUrl}/meal-plans/preview/meal/${position}/item/${foodId}/suggestions`,
  mealPlanItemReplace: (position: number, foodId: number) =>
    `${environment.apiBaseUrl}/meal-plans/preview/meal/${position}/item/${foodId}/replace`,
  mealPlanEditDraft: (id: number | string) =>
    `${environment.apiBaseUrl}/meal-plans/${id}/edit-draft`,
  mealPlanArchive: (id: number | string) => `${environment.apiBaseUrl}/meal-plans/${id}/archive`,
  mealPlanFavorite: (id: number | string) => `${environment.apiBaseUrl}/meal-plans/${id}/favorite`,

  registros: () => `${environment.apiBaseUrl}/registro`,
  registro: (id: number | string) => `${environment.apiBaseUrl}/registro/${id}`,

  diaryDay: () => `${environment.apiBaseUrl}/diary/day`,
  diaryRecentFoods: () => `${environment.apiBaseUrl}/diary/recent-foods`,
  diaryEntries: () => `${environment.apiBaseUrl}/diary/entries`,
  diaryEntry: (id: number | string) => `${environment.apiBaseUrl}/diary/entries/${id}`,
  diaryMeals: () => `${environment.apiBaseUrl}/diary/meals`,
  diaryMeal: (id: number | string) => `${environment.apiBaseUrl}/diary/meals/${id}`,

  metas: () => `${environment.apiBaseUrl}/meta`,
  meta: (id: number | string) => `${environment.apiBaseUrl}/meta/${id}`,

  recomendacoes: () => `${environment.apiBaseUrl}/recomendacao`,
  recomendacao: (id: number | string) => `${environment.apiBaseUrl}/recomendacao/${id}`,
};
