# Vitality PLUS — Frontend

Frontend novo do Vitality PLUS (Angular 20 + bandeira-ui + Tailwind v4), consumindo o backend
Laravel existente em `../vitality-Back`. Este documento é a referência viva do projeto — sempre
que uma decisão de arquitetura mudar ou o contrato da API for corrigido, atualize aqui.

## Stack

- **Angular 20** (standalone components, `ChangeDetectionStrategy.OnPush` sempre, Signals para
  todo estado, `inject()` em vez de constructor injection, lazy loading via `loadComponent` em
  toda rota de feature).
- **bandeira-ui** — biblioteca de componentes própria do autor. Não está publicada no npm apesar
  do que a documentação do pacote sugere; é instalada via tarball local em `vendor/bandeira-ui-*.tgz`
  (mesmo padrão do `portfolio-joaopedro`). Peer deps: `@angular/cdk` `>=20.0.0`.
- **Tailwind v4** (CSS-first, sem `tailwind.config.js`) — suporte nativo do `@angular/build`,
  basta `@use "tailwindcss";` no `styles.scss`. Usar `@use`, não `@import` (Sass deprecou `@import`
  e gera warning de build).
- **ngx-toastr** `^19` (não a última major — `^20` exige Angular 21) + `@angular/animations`
  (`provideAnimations()`), configurados em `app.config.ts`, não em `main.ts`.
- **Font Awesome Free** (`@fortawesome/fontawesome-free`, classes `fas fa-*`) para ícones —
  mesma biblioteca usada no `portfolio-joaopedro`. CSS incluído via `angular.json > styles`
  (não é peso pequeno: por isso o budget de produção foi ajustado para 700kB/1.2MB, igual ao
  portfólio).
- **TypeScript strict** (o `tsconfig.json` gerado pelo `ng new` do Angular 20 já vem estrito o
  suficiente: `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`,
  `strictTemplates`, `strictInjectionParameters`).
- Testes: Jasmine/Karma (padrão do `ng new`, mesmo setup do portfólio).
- Só PT-BR por enquanto — sem i18n multi-idioma.

## Como rodar

```bash
npm install
npm start          # http://localhost:4200
npm run build
npm test
```

Backend em paralelo, em `../vitality-Back`:

```bash
php artisan serve  # http://localhost:8000
```

O `.env` do backend precisa ter `FRONTEND_URL=http://localhost:4200` (necessário para o CORS
liberar o Angular — o `config/cors.php` do backend só aceita **uma** origin por vez).

## Estrutura de pastas — Atomic Design + Features

Pastas por **feature** (área do produto) para tudo específico de uma tela; hierarquia **atômica**
dentro de `shared/` para tudo reutilizável entre features.

```
src/app/
  core/
    auth/       auth.service.ts, auth.guard.ts, guest.guard.ts, auth.interceptor.ts, token.storage.ts
    http/       error.interceptor.ts, api-paths.ts
    models/     user, alimento, refeicao, dieta, registro, meta-diaria,
                nutricao-recomendada, api-response, nutrientes
    layout/     app-shell/, theme.service.ts
  shared/
    atoms/       wrappers finos sobre a bandeira-ui — só quando agregam valor
    molecules/   combinações pequenas reutilizadas por 2+ features
    organisms/   blocos grandes e compostos reutilizados por 2+ features
                 (ex.: auth-poster-layout/ — chrome visual "Feira Vitality" das telas de auth)
    pipes/
    utils/       nutrient-calc.util.ts (fator qtd_pivot/qtd_base, replica o cálculo do backend
                 para preview client-side antes de salvar)
  features/
    auth/{login,register}/
    dashboard/
    diario/{diario-list,diario-form,data}/
    alimentos/{alimentos-list,alimento-form,data}/
    dietas/{dietas-list,dieta-form,data}/
    metas/
      data/                        meta.service.ts
      metas-page/
        metas-page.component.*     orquestrador — fase/passo/sugestão, navegação (bd-steps)
        metas-step.scss            shell visual comum aos 4 passos (styleUrl compartilhado)
        macro-summary/             anel + chips de macro (sm/lg), 3 usos dentro da feature
        steps/
          step-footer/             rodapé padrão (voltar + botão circular) — usado pelos 4 passos
          perfil-step/             passo 1 — lógica e form próprios, injeta UserService direto
          atividade-step/          passo 2 — idem, calcula a sugestão a partir da própria resposta
          sugestao-step/           passo 3 — só apresentação, sem serviço
          revisar-step/            passo 4 — form + salva recomendação/meta, emite ao concluir
    recomendacao/{data}/            (sem página própria — a UI virou o passo "Sugestão" do quiz)
    perfil/{perfil-page,data}/
    ui-check/    smoke test visual da Fase 0 — remover quando o dashboard real existir
  app.routes.ts
  app.config.ts
```

**Regra de promoção**: um componente nasce dentro da feature que o criou. Na hora em que uma
**segunda** feature precisar dele, ele sobe para `shared/molecules` ou `shared/organisms` — nunca
duplicar. Dentro de cada feature, componentes de uso único ficam soltos na própria pasta (sem
sub-hierarquia atômica interna).

Cada `features/<nome>/data/<nome>.service.ts` é próprio da feature — não centralizar tudo em
`core`.

## Decisões de arquitetura

- **Tokens únicos**: `--bd-*` (definidos pela bandeira-ui) são a fonte de verdade visual.
  `src/styles.scss` sobrescreve os `--bd-*` default com a paleta do produto e o `@theme` do
  Tailwind aponta para os mesmos `--bd-*` — sem duplicar paleta em dois lugares. Tema controlado
  via `data-theme` no `documentElement` (`ThemeService` em `core/layout/theme.service.ts`),
  persistido em `localStorage`, com script anti-flash no `index.html`.
- **Paleta "Cozinha Quente"** (2026-08-13, escolhida entre 5 mockups de menu/topbar): coral
  (`--bd-primary`) + mostarda (`--bd-accent`) sobre areia clara — substituiu a paleta original
  "saúde/nutrição" (verde-menta/laranja) da Fase 0. É a paleta de TODA a área autenticada (cards,
  botões, badges), não só do menu.
- **Auth via Bearer token puro** (Sanctum), sem cookies/CSRF — mesmo com
  `supports_credentials: true` no CORS do backend, não é necessário `withCredentials`.
- **`authInterceptor`** só anexa `Authorization` em requests para `environment.apiBaseUrl` — nunca
  nas rotas de auth (`environment.apiUrl`, sem `/api`).
- **`errorInterceptor`** trata 401 em rota protegida como sessão expirada (logout + redirect
  `/login`) e qualquer outro erro com toast genérico — exceto nas rotas de login/registro, que
  tratam o próprio erro por campo (ver contrato abaixo).
- **Sessão restaurada no boot**: `provideAppInitializer` chama `AuthService.restoreSession()`
  antes da primeira navegação, para um refresh de página não deslogar quem já tinha token válido.
- **Identidade visual "Feira Vitality" nas telas de auth**: login/registro têm uma paleta própria
  (pôster de feira livre — manga/ameixa/creme), diferente do resto do app ("Cozinha Quente").
  Em vez de duplicar layout, `shared/organisms/auth-poster-layout/` sobrescreve os tokens `--bd-*`
  só no próprio `:host` (custom properties herdam pela árvore do DOM, independente de view
  encapsulation) — os componentes `bd-field`/`bdInput`/`bdButton` projetados dentro saem retemados
  sem tocar no tema global. Esse é o padrão a seguir sempre que uma tela precisar de uma paleta
  isolada sem reescrever os componentes da lib.
- **Menu lateral não usa `BdAppShellComponent`**: o layout desejado (sidebar de altura cheia +
  topbar só na coluna de conteúdo) não bate com a estrutura fixa da lib (header full-width acima
  de tudo). `core/layout/app-shell/` é markup próprio, reaproveitando só os átomos da lib
  (`bd-avatar`, `bdButton`, `bdTooltip`). A cor de fundo do menu (`--sidebar-bg`, oliva escuro) é
  uma variável local do componente, **não** um token `--bd-*` global — mesma lição do bug de
  contraste da Fase 1: `--bd-bg` é lido pelo `bd-input` como o próprio fundo de campo, então nunca
  reaproveitar esse token pra pintar um painel de chrome.
  Gaveta mobile (<900px) implementada à mão (sem a gaveta pronta da lib) — `mobileMenuOpen` signal
  + scrim + fecha em `Escape`. Falta ainda: foco preso dentro da gaveta enquanto aberta (Fase 9).
- **Ícone de tema é SVG inline, não Font Awesome**: sol (raios) em dark / lua (crescente) em
  light, linework fino (`stroke-width="2"`, `currentColor`) — estilo dos ícones do mockup "Cozinha
  Quente", diferente do resto dos ícones do app (que usam Font Awesome `fas fa-*`). Se algum dia
  todo o set de ícones migrar pra linework próprio, esse par de SVGs já está no padrão certo.

## Design tokens — paleta "Cozinha Quente"

Fonte de verdade: `src/styles.scss` (`:root` e `:root[data-theme='dark']`). Qualquer artefato,
mockup ou tela nova **usa exatamente estes valores** — não inventar tom novo "parecido". Se uma
tela precisar de uma paleta deliberadamente diferente (caso da auth, ver acima), isso é exceção
documentada, não a regra.

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--bd-bg` | `#f7f1e4` | `#171410` | Fundo da página. **Também é o fundo que `bd-input` usa pra si mesmo** — nunca reaproveitar pra pintar um painel/chrome escuro (bug já cometido na Fase 1). |
| `--bd-surface` / `--bd-bg-elevated` | `#fffdf7` | `#201c14` | Cards, campos, superfícies elevadas. |
| `--bd-surface-hover` | `#f2e9d4` | `#29241a` | Hover de linha/item. |
| `--bd-border` | `#eae0c8` | `#362f22` | Borda padrão. |
| `--bd-border-strong` | `#d9c9a0` | `#4a4030` | Borda em hover/foco. |
| `--bd-fg` | `#2b2417` | `#f3eedf` | Texto principal. |
| `--bd-fg-muted` | `#786d54` | `#b3a88f` | Texto secundário/legenda. |
| `--bd-fg-subtle` | `#a99d7e` | `#7d735c` | Placeholder, texto terciário. |
| `--bd-primary` | `#e2694b` (coral) | `#f2895f` | Ação principal, CTA, estado ativo. |
| `--bd-primary-strong` | `#c94f32` | `#ef7248` | Hover do primary. |
| `--bd-primary-soft` | `rgba(226,105,75,.14)` | `rgba(242,137,95,.18)` | Fundo suave (badge, item ativo). |
| `--bd-accent` | `#d9a441` (mostarda) | `#e8be5d` | Destaque secundário — nunca disputa com o primary na mesma composição. |
| `--bd-accent-soft` | `rgba(217,164,65,.16)` | `rgba(232,190,93,.18)` | Fundo suave do accent. |
| `--bd-danger`/`--bd-warning`/`--bd-success` | defaults da lib (não sobrescritos) | idem | Semântico — separado do accent de marca, não usar coral/mostarda pra status. |
| `--sidebar-bg` (só no app-shell) | `#3e4a34` (oliva escuro) | mesmo | Cor de chrome, não é token `--bd-*` global — ver nota do menu lateral acima. |
| `--bd-radius` | `0.875rem` | idem | Raio padrão de card/botão/input. |

Tipografia: `--bd-font-sans` (herdado da lib, `'Inter', system-ui, ...` — sem `@font-face`
próprio, cai pro stack do sistema na prática). Números tabulares (`font-variant-numeric:
tabular-nums`) em qualquer lugar com dígito alinhado em coluna (macros, calorias, tabelas).

**Mapeamento de cor para macros** (gráficos/anéis de proteína·carbo·gordura — Metas, Diário,
Dashboard): proteína = `--bd-primary` (coral), carboidrato = `--bd-accent` (mostarda), gordura =
`#6b8552` (oliva — tom claro da família da sidebar, não um token `--bd-*` novo). Três cores que já
pertencem ao sistema, nenhuma inventada pra virar "a quarta cor da marca".

## Contrato da API (backend em `../vitality-Back`)

Base local: `http://localhost:8000`.

### Rotas de auth

`/login` e `/criar-usuario` foram **movidas** de `routes/auth.php` (grupo `web`: sessão + CSRF)
para `routes/api.php` (grupo `api`), fora do bloco `auth:sanctum` — ficam então em `/api/login` e
`/api/criar-usuario`. `/register`, `/forgot-password`, `/reset-password` continuam no scaffold do
Breeze (`routes/auth.php`) — não usados por este front.

**Causa raiz real do "CSRF token mismatch" (2026-08-12/13, duas camadas):**
1. As rotas viviam em `routes/auth.php` (grupo `web`) — corrigido movendo pra `routes/api.php`.
2. Mesmo depois de mover, o bug persistia **só quando a requisição tinha header `Origin`** (ou
   seja, sempre que vem de um navegador de verdade — testar com `curl` sem `Origin` mascarava o
   problema). Causa: `EnsureFrontendRequestsAreStateful` (Sanctum), prependada ao grupo `api` em
   `bootstrap/app.php`, promove qualquer request cujo `Origin` bata em `SANCTUM_STATEFUL_DOMAINS`
   (`localhost:4200`) pra sessão + CSRF — **mesmo a rota estando em `routes/api.php`**. Essa
   middleware existe pra SPA autenticada por cookie, fluxo que este front não usa (decisão:
   Bearer token puro). Removida de `bootstrap/app.php`; `auth:sanctum` continua funcionando
   normalmente nas rotas protegidas (testado ponta a ponta com `Authorization: Bearer <token>`
   após a remoção).
3. Se um novo endpoint público (sem `auth:sanctum`) for adicionado no futuro, testar sempre com
   `curl -H "Origin: http://localhost:4200"` — sem esse header o bug não aparece e engana o teste.

| Rota | Observação |
|---|---|
| `POST /api/login` | Responde `{status, token, user, message}` em 201. **401** = senha errada, **404** = e-mail não encontrado — tratado por campo no formulário (`LoginComponent`), não como toast genérico. Testado ponta a ponta contra o backend real. |
| `POST /api/criar-usuario` | `UserController::storeUser` — **não usar `/register`** (scaffold Breeze, sessão). Exige `name, email, password, password_confirmation` (regra `confirmed` no backend — o front valida os dois lados também, `RegisterComponent`). Resposta confirmada: `{message, data: User, success}`, **sem token** — nunca autentica direto, sempre redireciona pro `/login` depois de criar a conta. Dispara seed de refeições/alimentos padrão pro novo usuário. Testado ponta a ponta contra o backend real. |
| `POST /forgot-password`, `POST /reset-password` | Fluxo de recuperação de senha do Breeze — não usado por este front. |
| `POST /logout` | Continua em `routes/auth.php` (guard `web`), **não confiável com Bearer token** — não foi movida (baixo risco, já tratada como best-effort). Tratar logout como client-side (apagar token, redirecionar). |

### Tudo mais — sob `/api`, protegido por `auth:sanctum`, header `Authorization: Bearer <token>`

Resposta geralmente `{data, success, message?}`. **Nenhum endpoint pagina.**

| Recurso | Rotas | Campos / observações |
|---|---|---|
| Me | `GET /api/user/get-with-token` | Usuário autenticado a partir do token. |
| Alimento | `/api/food[/{id}]` | `descricao, proteina, gordura, caloria, carbo, qtd` (valores por `qtd` base, ex. 100g). `index` retorna alimentos do usuário **+** globais (`id_usuario === null`, tabela TACO) — globais são read-only na UI. |
| Refeição | `/api/refeicao[/{id}]` | `descricao, horario` — é o *tipo* de refeição (ex. "Café da manhã"), não o que foi comido. |
| Dieta | `/api/dieta[/{id}]` | `descricao, id_refeicao, alimentos:[{id,qtd}]` — plano reutilizável. `index` já retorna totais agregados. |
| Registro | `/api/registro[/{id}]` | `data, id_refeicao, alimentos:[{id,qtd}]` — o diário real (o que foi comido). `index` retorna `{id, data, descricao_refeicao, alimentos:[...], nutrientes_totais:{...}}`. Fator de cálculo: `qtd_pivot / qtd_base_alimento` (replicado em `shared/utils/nutrient-calc.util.ts` para preview client-side). |
| Meta diária | `/api/meta[/{id}]` | `meta_calorias, meta_proteinas, meta_carboidratos, meta_gorduras, data?`. O backend não impede duplicatas, mas o front trata a meta com `data: null` como "a vigente" e faz upsert nela (`MetaService.save`) — evita acumular registros a cada salvamento. |
| Recomendação | `/api/recomendacao[/{id}]` | `get` (Gasto Energético Total), `tmb` (Taxa Metabólica Basal), `caloria, proteina, carbo, gordura`. **1 por usuário** — `POST` dá 400 se já existe. Em vez de reagir ao 400, `RecomendacaoService.save` sempre consulta o `index` antes e decide `POST`/`PUT` — mais previsível. `shared/utils/recomendacao-calc.util.ts` calcula uma sugestão inicial (TMB Mifflin-St Jeor + fator de atividade) a partir do perfil do usuário (peso/altura/idade/gênero/atividade/objetivo — campos da Fase 8); sem esses dados, o formulário fica em preenchimento manual. |
| User | `/api/users`, `/api/user/{id}`, `PUT /api/user/{id}` (multipart, avatar), `/api/user/update-profile-pic/{id}`, `/api/user/delete-profile-pic/{id}` | `name, email, password, data_nascimento, genero, peso, altura, avatar, nivel_atividade, objetivo`. **`name` e `email` são obrigatórios em TODO `PUT`**, mesmo atualizando só outro campo — `UserService.updateProfile()` sempre inclui os dois a partir de `AuthService.currentUser()`. Corrigido em 2026-08-13: o `update()` fazia `$user->update([...$request->campo])` com todo campo ausente virando `null`, **apagando o resto do perfil a cada PUT parcial** (achado ao implementar o quiz de Metas — passo 2 zerava peso/altura salvos no passo 1). Agora usa `$request->only([...])`, que só toca nos campos realmente enviados — testado ponta a ponta. |

Todos os caminhos acima são centralizados em `core/http/api-paths.ts` (`authPaths` / `apiPaths`) —
usar sempre essas funções em vez de montar strings de URL na mão.

### Inconsistências conhecidas do backend (o front contorna, não corrige — fora de escopo por ora)

- `/logout` real é sessão Breeze, incompatível com Bearer token (única rota de auth que não foi
  movida pro grupo `api` — ver acima).
- Falta checagem de "dono do recurso" em alguns `show`/`update`/`destroy` (ex. `AlimentoController`,
  `DietaController`, `RefeicaoController`) — qualquer usuário autenticado pode, em teoria, acessar
  recurso de outro por ID.
- Nenhum endpoint pagina — atenção a performance em listas grandes (ex. `/food` com a tabela TACO
  inteira).

## Roadmap de implementação (Plano B)

Ver plano completo em `C:\Users\JP\.claude\plans\vamos-melhorar-o-vitality-magical-aho.md`. Resumo
das fases, cada uma pequena e testável ponta a ponta contra o backend real:

0. Bootstrap visual (`/ui-check`) — ✅ feito.
1. Autenticação (login/registro, token persistido) — ✅ feito, com identidade visual "Feira
   Vitality" e confirmação de senha no cadastro. Testado ponta a ponta contra o backend real.
2. App Shell autenticado (`BdAppShellComponent`) + guards + logout — ✅ feito.
3. Recomendação nutricional + Metas diárias — ✅ feito, revisão 2026-08-13 (duas rodadas): os dois
   formulários soltos da primeira versão viraram um **"Quiz Guiado"** (`features/metas/metas-page/`)
   — 4 passos (perfil → atividade/objetivo → sugestão calculada → revisar e salvar), escolhido
   entre 8 mockups comparados. Segunda passada trocou o indicador de etapas customizado por
   `<bd-steps variant="numbered" orientation="vertical" clickable>` da própria lib (sidebar
   esquerda, 220px, sticky) e abriu o layout pra duas colunas (steps | conteúdo, `max-width: 840px`)
   em vez da coluna única de 480px — menos espaço vazio, painel de resumo mais horizontal (anel +
   chips lado a lado numa faixa larga, não empilhado). Avançar de etapa é um botão circular com
   seta (`round-next`, vira ✓ verde na última etapa) no rodapé do card, não mais um botão de texto
   full-width. `bd-steps` só deixa voltar a etapas concluídas (`clickable`), nunca pular pra
   frente — `irPara()` reforça isso do lado do componente também. Estado "configurado" mostra o
   resumo direto e oferece "Refazer metas" em vez de forçar o quiz de novo a cada visita. Puxou
   pra frente um `UserService.updateProfile()` mínimo (em `features/perfil/data/`) que a Fase 8
   completa depois — sem isso o passo 1 do quiz não tinha onde salvar peso/altura/gênero.
   Terceira passada (mesmo dia): cada passo virou componente próprio (`steps/*-step/`), cada um
   com sua validação e sua própria chamada de serviço — `PerfilStepComponent` injeta `UserService`
   direto, `AtividadeStepComponent` idem (e calcula a sugestão a partir da resposta do próprio
   save, sem reconsultar nada), `SugestaoStepComponent` é só apresentação, `RevisarStepComponent`
   injeta `RecomendacaoService`/`MetaService`. O componente pai (`MetasPageComponent`) virou um
   orquestrador puro: só `fase`/`passo`/`sugestao` + navegação, escuta os `output()` de cada passo.
   Uniformidade de layout garantida por construção, não por convenção: `metas-step.scss` é UM
   arquivo de estilo que os 4 componentes de passo compartilham via `styleUrl` (cada um encapsula
   sua própria cópia, mas o conteúdo é idêntico — mudar o arquivo muda os 4 de uma vez);
   `StepFooterComponent` é o rodapé (voltar + botão circular) usado pelos 4; `MacroSummaryComponent`
   é o anel+chips usado nos 3 lugares que mostram macro (tira do quiz, painel "configurado", e
   reaproveitável no passo de sugestão se um dia precisar).
4. Alimentos (CRUD) — valida o padrão lista+form antes de dietas/registro.
5. Diário/Registro — feature central do produto.
6. Dashboard (meta vs. consumido).
7. Dietas (planos reutilizáveis).
8. Perfil (dados pessoais + avatar) — `UserService` já existe (ver Fase 3), falta upload de
   avatar e o resto da tela.
9. Polimento transversal (onboarding, estados vazios, a11y, testes essenciais) — intercalado com as demais.
