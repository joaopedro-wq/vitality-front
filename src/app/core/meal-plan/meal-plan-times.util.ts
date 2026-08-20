/** Horários default por quantidade de refeições — usado tanto pelo fluxo por
 * IA (`DietaFormComponent`) quanto pelo fluxo manual (`ManualDietaFormComponent`)
 * como sugestão inicial de `meal_times`. */
const TIMES: Record<3 | 4 | 5, string[]> = {
  3: ['08:00', '12:30', '19:30'],
  4: ['08:00', '12:30', '16:30', '20:00'],
  5: ['07:30', '10:30', '13:00', '16:30', '20:00'],
};

/** O tipo `3|4|5` só vale em compilação — `mealCount` pode chegar aqui a
 * partir de um valor não validado em runtime (ex. `profile.meal_count` da
 * API). Cai pro conjunto de 4 refeições em vez de devolver `undefined` e
 * estourar quem indexa o retorno sem checar. */
export function horariosPadrao(mealCount: 3 | 4 | 5): string[] {
  return TIMES[mealCount] ?? TIMES[4];
}
