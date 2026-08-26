import { environment } from '../../../environments/environment';

export const authPaths = {
  login: () => `${environment.apiBaseUrl}/login`,
  criarUsuario: () => `${environment.apiBaseUrl}/criar-usuario`,
  register: () => `${environment.apiUrl}/register`,
  forgotPassword: () => `${environment.apiUrl}/forgot-password`,
  resetPassword: () => `${environment.apiUrl}/reset-password`,
  csrfCookie: () => `${environment.apiUrl}/sanctum/csrf-cookie`,
  logout: () => `${environment.apiBaseUrl}/logout`,
};

export const apiPaths = {
  me: () => `${environment.apiBaseUrl}/user`,
  sessionRefresh: () => `${environment.apiBaseUrl}/session/refresh`,

  dashboardSummary: () => `${environment.apiBaseUrl}/dashboard/summary`,
  users: () => `${environment.apiBaseUrl}/users`,
  user: () => `${environment.apiBaseUrl}/user`,
  userOnboarding: () => `${environment.apiBaseUrl}/user/onboarding`,
  userAvatar: () => `${environment.apiBaseUrl}/user/avatar`,

  alimentos: () => `${environment.apiBaseUrl}/foods`,
  alimento: (id: number | string) => `${environment.apiBaseUrl}/foods/${id}`,
  gruposAlimentos: () => `${environment.apiBaseUrl}/foods/groups`,
  gruposNormalizadosAlimentos: () => `${environment.apiBaseUrl}/foods/groups-normalized`,
  favoritoAlimento: (id: number | string) => `${environment.apiBaseUrl}/foods/${id}/favorite`,
  adminAlimentos: () => `${environment.apiBaseUrl}/admin/foods`,
  adminUsuarios: () => `${environment.apiBaseUrl}/admin/users`,
  adminUsuario: (id: number | string) => `${environment.apiBaseUrl}/admin/users/${id}`,
  adminAlimento: (id: number | string) => `${environment.apiBaseUrl}/admin/foods/${id}`,
  adminArquivarAlimento: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/archive`,
  adminRestaurarAlimento: (id: number | string) =>
    `${environment.apiBaseUrl}/admin/foods/${id}/restore`,
  adminImportarTaco: () => `${environment.apiBaseUrl}/admin/foods/import-taco`,
  adminImportarPlanilhaTaco: () => `${environment.apiBaseUrl}/admin/foods/import-taco-spreadsheet`,
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
  mealPlanFeasibility: () => `${environment.apiBaseUrl}/meal-plan-feasibility`,
  mealPlanPreview: () => `${environment.apiBaseUrl}/meal-plans/preview`,
  mealPlanManualPreview: () => `${environment.apiBaseUrl}/meal-plans/manual/preview`,
  mealPlanManualAddMeal: () => `${environment.apiBaseUrl}/meal-plans/manual/preview/meal`,
  mealPlanManualMeal: (position: number) =>
    `${environment.apiBaseUrl}/meal-plans/manual/preview/meal/${position}`,
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

  groups: () => `${environment.apiBaseUrl}/groups`,
  group: (id: number | string) => `${environment.apiBaseUrl}/groups/${id}`,
  groupJoin: () => `${environment.apiBaseUrl}/groups/join`,
  groupLeave: (id: number | string) => `${environment.apiBaseUrl}/groups/${id}/leave`,
  groupRanking: (id: number | string) => `${environment.apiBaseUrl}/groups/${id}/ranking`,
  groupActivity: (id: number | string) => `${environment.apiBaseUrl}/groups/${id}/activity`,
};
