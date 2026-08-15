import type { Alimento, NutrienteAlimento } from '../../core/models/alimento.model';
import type { DiaryNutrient } from '../../core/models/diary.model';

export interface FoodQuantity {
  foodId: number;
  quantity: number;
}

export function somarNutrientesDaRefeicao(
  itens: readonly FoodQuantity[],
  alimentos: readonly Alimento[],
): DiaryNutrient[] {
  const alimentosPorId = new Map(alimentos.map((alimento) => [alimento.id, alimento]));
  const totais = new Map<string, DiaryNutrient>();

  for (const item of itens) {
    const alimento = alimentosPorId.get(item.foodId);
    if (!alimento || !alimento.qtd || !alimento.nutrientes?.length) continue;

    const fator = item.quantity / alimento.qtd;
    for (const nutriente of alimento.nutrientes) {
      if (nutriente.categoria === 'macro') continue;
      acumularNutriente(totais, nutriente, fator);
    }
  }

  return [...totais.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function acumularNutriente(
  totais: Map<string, DiaryNutrient>,
  nutriente: NutrienteAlimento,
  fator: number,
): void {
  const chave = `${nutriente.codigo}:${nutriente.unidade}`;
  const anterior = totais.get(chave);
  const valor = nutriente.valor * fator;

  totais.set(chave, {
    codigo: nutriente.codigo,
    nome: nutriente.nome,
    unidade: nutriente.unidade,
    valor: (anterior?.valor ?? 0) + valor,
  });
}
