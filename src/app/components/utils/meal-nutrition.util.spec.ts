import type { Alimento } from '../../core/models/alimento.model';

import { somarNutrientesDaRefeicao } from './meal-nutrition.util';

describe('somarNutrientesDaRefeicao', () => {
  it('soma somente micronutrientes na proporção consumida', () => {
    const alimentos: Alimento[] = [
      criarAlimento(1, 100, [
        {
          codigo: 'CA',
          nome: 'Cálcio',
          unidade: 'mg',
          categoria: 'mineral',
          valor: 120,
          tipo_dado: null,
        },
        {
          codigo: 'PTN',
          nome: 'Proteína',
          unidade: 'g',
          categoria: 'macro',
          valor: 20,
          tipo_dado: null,
        },
      ]),
      criarAlimento(2, 50, [
        {
          codigo: 'CA',
          nome: 'Cálcio',
          unidade: 'mg',
          categoria: 'mineral',
          valor: 30,
          tipo_dado: null,
        },
        {
          codigo: 'FE',
          nome: 'Ferro',
          unidade: 'mg',
          categoria: 'mineral',
          valor: 2,
          tipo_dado: null,
        },
      ]),
    ];

    expect(
      somarNutrientesDaRefeicao(
        [
          { foodId: 1, quantity: 50 },
          { foodId: 2, quantity: 100 },
        ],
        alimentos,
      ),
    ).toEqual([
      { codigo: 'CA', nome: 'Cálcio', unidade: 'mg', valor: 120 },
      { codigo: 'FE', nome: 'Ferro', unidade: 'mg', valor: 4 },
    ]);
  });
});

function criarAlimento(
  id: number,
  qtd: number,
  nutrientes: NonNullable<Alimento['nutrientes']>,
): Alimento {
  return {
    id,
    descricao: `Alimento ${id}`,
    descricao_original: `Alimento ${id}`,
    detalhe_exibicao: null,
    proteina: 0,
    gordura: 0,
    carbo: 0,
    caloria: 0,
    qtd,
    fonte: 'taco',
    source_reference: null,
    grupo: null,
    illustration_key: null,
    status: 'ativo',
    is_favorite: false,
    image_url: null,
    updated_at: null,
    nutrientes,
  };
}
