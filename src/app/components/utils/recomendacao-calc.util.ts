import type { NivelAtividade, Objetivo, User } from '../../core/models/user.model';

const FATOR_ATIVIDADE: Record<NivelAtividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muito_intenso: 1.9,
};

const AJUSTE_CALORIA_POR_OBJETIVO: Record<Objetivo, number> = {
  emagrecer: -500,
  manter: 0,
  ganhar_massa: 300,
};

export interface SugestaoRecomendacao {
  tmb: number;
  get: number;
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

function idadeAPartirDe(dataNascimento: string): number {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

/**
 * Estimativa client-side (TMB por Mifflin-St Jeor + fator de atividade) só
 * para sugerir valores iniciais no formulário — o usuário sempre pode ajustar
 * antes de salvar. Não substitui orientação nutricional profissional.
 * Retorna `null` quando o perfil (Fase 8) ainda não tem os dados necessários.
 */
export function calcularSugestaoRecomendacao(user: User | null): SugestaoRecomendacao | null {
  if (!user || !user.peso || !user.altura || !user.data_nascimento || !user.genero || !user.nivel_atividade || !user.objetivo) {
    return null;
  }

  const idade = idadeAPartirDe(user.data_nascimento);
  const base = 10 * user.peso + 6.25 * user.altura - 5 * idade;
  const tmb = user.genero === 'M' ? base + 5 : user.genero === 'F' ? base - 161 : base - 78;

  const get = tmb * FATOR_ATIVIDADE[user.nivel_atividade];
  const caloria = get + AJUSTE_CALORIA_POR_OBJETIVO[user.objetivo];

  const proteina = user.peso * 2;
  const gorduraCal = caloria * 0.25;
  const gordura = gorduraCal / 9;
  const carbo = Math.max(0, (caloria - proteina * 4 - gorduraCal) / 4);

  return {
    tmb: Math.round(tmb),
    get: Math.round(get),
    caloria: Math.round(caloria),
    proteina: Math.round(proteina),
    carbo: Math.round(carbo),
    gordura: Math.round(gordura),
  };
}
