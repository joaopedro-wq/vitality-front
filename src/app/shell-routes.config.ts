/**
 * Rotas-raiz pro botão físico de voltar (Capacitor) — arquivo separado de
 * `shell-nav.config.ts` de propósito: `app.config.ts` (eager) importa isso,
 * e `shell-nav.config.ts` importa ~9 ícones Lucide no topo do arquivo. Um
 * import eager de QUALQUER binding de um módulo faz o módulo INTEIRO (com
 * seus imports de topo) ser avaliado — misturar os dois nesse mesmo arquivo
 * vazava os ícones pro bundle inicial mesmo eles só sendo usados dentro do
 * chunk lazy do app-shell (achado migrando pra `bandeira-shell`, regressão
 * de ~700kB→1MB no bundle inicial).
 */
export const ROTAS_RAIZ = ['/dashboard', '/login', '/'];
