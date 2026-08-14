import type {
  DiaryDay,
  DiaryEntry,
  DiaryMacros,
  DiaryMeal,
  SaveDiaryEntryPayload,
} from '../../core/models/diary.model';

export type MomentoRefeicao = 'manha' | 'almoco' | 'lanche' | 'jantar' | 'ceia';

export type EstadoFase = 'concluida' | 'atual' | 'aberta';

export interface FaseItem {
  entryId: number;
  foodId: number;
  descricao: string;
  illustrationKey: string | null;
  quantity: number;
  macros: DiaryMacros;
  consumedAt: string;
}

export interface FaseDiario {
  mealId: number;
  descricao: string;
  horario: string;
  momento: MomentoRefeicao;
  itens: FaseItem[];
  totais: DiaryMacros;
  estado: EstadoFase;
}

const ZERO: DiaryMacros = { caloria: 0, proteina: 0, carbo: 0, gordura: 0 };

export function momentoDaRefeicao(descricao: string): MomentoRefeicao {
  const nome = descricao.toLocaleLowerCase('pt-BR');
  if (nome.includes('café') || nome.includes('cafe') || nome.includes('manhã')) return 'manha';
  if (nome.includes('ceia')) return 'ceia';
  if (nome.includes('jantar') || nome.includes('noite')) return 'jantar';
  if (nome.includes('lanche') || nome.includes('tarde')) return 'lanche';
  return 'almoco';
}

export function chaveDoItem(item: FaseItem): string {
  return `${item.entryId}:${item.foodId}`;
}

export function escalarMacros(
  macrosRef: DiaryMacros,
  qtdRef: number,
  quantidade: number,
): DiaryMacros {
  const fator = qtdRef > 0 ? quantidade / qtdRef : 0;
  return {
    caloria: macrosRef.caloria * fator,
    proteina: macrosRef.proteina * fator,
    carbo: macrosRef.carbo * fator,
    gordura: macrosRef.gordura * fator,
  };
}

export function somarMacros(itens: readonly { macros: DiaryMacros }[]): DiaryMacros {
  return itens.reduce<DiaryMacros>(
    (total, { macros }) => ({
      caloria: total.caloria + macros.caloria,
      proteina: total.proteina + macros.proteina,
      carbo: total.carbo + macros.carbo,
      gordura: total.gordura + macros.gordura,
    }),
    { ...ZERO },
  );
}

export function itensDaFase(day: DiaryDay | null, mealId: number): FaseItem[] {
  if (!day) return [];
  return day.entries
    .filter((entry) => entry.meal.id === mealId)
    .flatMap((entry) =>
      entry.items.map((item) => ({
        entryId: entry.id,
        foodId: item.food_id,
        descricao: item.descricao,
        illustrationKey: item.illustration_key,
        quantity: item.quantity,
        macros: item.macros,
        consumedAt: entry.consumed_at,
      })),
    );
}

export function montarFases(day: DiaryDay | null, meals: readonly DiaryMeal[]): FaseDiario[] {
  let atualDefinida = false;

  return meals.map((meal) => {
    const itens = itensDaFase(day, meal.id);
    const concluida = itens.length > 0;
    let estado: EstadoFase = 'aberta';

    if (concluida) {
      estado = 'concluida';
    } else if (!atualDefinida) {
      estado = 'atual';
      atualDefinida = true;
    }

    return {
      mealId: meal.id,
      descricao: meal.descricao,
      horario: meal.horario,
      momento: momentoDaRefeicao(meal.descricao),
      itens,
      totais: somarMacros(itens),
      estado,
    };
  });
}

export function proximaFaseAberta(fases: readonly FaseDiario[]): number {
  return fases.findIndex((fase) => fase.estado === 'atual');
}

export function diaCompleto(fases: readonly FaseDiario[]): boolean {
  return fases.length > 0 && fases.every((fase) => fase.estado === 'concluida');
}

export function payloadSemItem(entry: DiaryEntry, foodId: number): SaveDiaryEntryPayload | null {
  const restantes = entry.items.filter((item) => item.food_id !== foodId);
  if (restantes.length === 0) return null;

  return {
    meal_id: entry.meal.id,
    consumed_at: new Date(entry.consumed_at).toISOString(),
    items: restantes.map((item) => ({ food_id: item.food_id, quantity: item.quantity })),
  };
}
