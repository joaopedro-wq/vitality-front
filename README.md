# Vitality PLUS

**Nutrição com propósito.** O Vitality PLUS transforma o cálculo de meta calórica — normalmente
uma planilha chata ou uma fórmula que ninguém entende — num quiz guiado que revela, passo a passo,
a meta ideal de calorias e macros de cada pessoa a partir do próprio perfil e rotina. Dali em
diante, é o hub diário de quem quer comer melhor sem perder a cabeça: registra o que comeu, monta
dietas reutilizáveis, acompanha o progresso contra a meta — tudo numa interface pensada pra ser
usada todo dia, não só configurada uma vez e esquecida.

Este repositório é o **frontend** do produto: uma single-page application em Angular que consome a
API do backend Laravel (`../vitality-Back`).

## O produto

- 🎯 **Quiz de metas** — em vez de um formulário longo, a meta calórica e de macros nasce de um
  fluxo em 4 passos (perfil → rotina e objetivo → sugestão calculada → confirmação), com a
  identidade de um quiz/jogo de verdade: cartões tocáveis, revelação animada do resultado, trilha
  de progresso navegável a qualquer momento. O cálculo usa a fórmula de Mifflin-St Jeor (TMB) mais
  fator de atividade — a mesma base científica usada por nutricionistas, sem exigir que o usuário
  saiba o que isso significa.
- 🍽️ **Diário alimentar** — o registro do que foi realmente comido, comparado contra a meta do dia.
- 📋 **Dietas reutilizáveis** — planos de refeição montados uma vez, reaproveitados sempre que
  quiser sem remontar a lista de alimentos do zero.
- 🥗 **Banco de alimentos** — biblioteca própria de alimentos do usuário somada à tabela TACO
  (composição nutricional de alimentos brasileiros), com valores de proteína/carboidrato/gordura/
  calorias por porção.
- 📊 **Painel de acompanhamento** — meta vs. consumido, num relance.
- 👤 **Perfil** — peso, altura, idade, nível de atividade e objetivo alimentam o cálculo da meta
  automaticamente; atualizar qualquer um deles é o gatilho pra refazer o quiz e recalcular.

Áreas com ✅ já implementadas e testadas ponta a ponta contra o backend real: autenticação, quiz de
metas/recomendação nutricional. O restante do roadmap — alimentos, diário, dietas, dashboard,
perfil completo — está em desenvolvimento incremental.

## Identidade visual

Duas paletas convivem no produto, cada uma resolvendo um problema diferente de identidade:

- **"Feira Vitality"** nas telas de autenticação — manga, ameixa e creme, evocando uma feira livre
  de produtos frescos.
- **"Cozinha Quente"** no restante da área autenticada — coral e mostarda sobre areia clara, uma
  paleta de cozinha, quente e apetitosa, sem cair em clichê de "app de saúde" (verde-menta
  genérico).

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Angular 20 — standalone components, Signals, `inject()`, lazy loading por rota |
| Design system | [bandeira-ui](https://www.npmjs.com/package/bandeira-ui) (biblioteca própria do autor) |
| Estilo | Tailwind v4 (CSS-first) — utilitário sempre que possível, SCSS só onde Tailwind não alcança |
| Ícones | [Lucide](https://lucide.dev) via `@lucide/angular` |
| Notificações | ngx-toastr |
| Linguagem | TypeScript strict |
| Testes | Jasmine / Karma |
| Backend consumido | Laravel + Sanctum (Bearer token), em `../vitality-Back` |

A organização de pastas do código está detalhada em [`ESTRUTURA.md`](./ESTRUTURA.md).

## Rodando localmente

Pré-requisitos: Node.js compatível com Angular 20 (LTS atual) e o backend em `../vitality-Back`
rodando em paralelo.

```bash
npm install
npm start          # http://localhost:4200
```

Em outro terminal, dentro de `../vitality-Back`:

```bash
php artisan serve  # http://localhost:8000
```

O `.env` do backend precisa ter `FRONTEND_URL=http://localhost:4200` (necessário pro CORS liberar
o Angular).

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm start` | Sobe o dev server (`ng serve`) em `http://localhost:4200`, com reload automático. |
| `npm run build` | Build de produção, otimizado, em `dist/`. |
| `npm test` | Roda a suíte de testes (Jasmine/Karma). |

## Estrutura de pastas

```
src/app/
  core/         auth, http, models, layout (app-shell, tema)
  components/   atoms/molecules/organisms/pipes/utils/directives reutilizáveis
  services/     todo service que fala com o backend (HttpClient)
  features/     uma pasta por área do produto (auth, metas, alimentos, diário, dietas, perfil...)
```

Os critérios completos de organização — o que nasce em `components/` vs. dentro de uma `feature/`,
por que `services/` é plano sem subpasta por feature — estão em
[`ESTRUTURA.md`](./ESTRUTURA.md).
