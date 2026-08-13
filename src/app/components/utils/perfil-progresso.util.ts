import type { User } from '../../core/models/user.model';

/** Campos considerados para o selo "Perfil X% completo" — mesmo peso cada. */
const CAMPOS_PERFIL: (keyof User)[] = [
  'name',
  'email',
  'avatar',
  'data_nascimento',
  'genero',
  'peso',
  'altura',
  'nivel_atividade',
  'objetivo',
];

/**
 * Percentual de completude do perfil (0–100), usado no selo do crachá de
 * jogador (`vtp-profile-photo-card` e tela de conclusão do quiz de Perfil).
 * Um preview de avatar ainda não salvo conta como preenchido — reflete o que
 * o usuário está prestes a confirmar, não só o que já está persistido.
 */
export function calcularProgressoPerfil(user: User | null, avatarPendente = false): number {
  if (!user) return 0;

  const preenchidos = CAMPOS_PERFIL.filter((campo) => {
    if (campo === 'avatar' && avatarPendente) return true;
    const valor = user[campo];
    return valor !== null && valor !== undefined && valor !== '';
  }).length;

  return Math.round((preenchidos / CAMPOS_PERFIL.length) * 100);
}
