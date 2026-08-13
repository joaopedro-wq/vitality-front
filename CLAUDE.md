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
    metas/{metas-page,data}/
    recomendacao/{recomendacao-page,data}/
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
  `src/styles.scss` sobrescreve os `--bd-*` default com a paleta "saúde/nutrição" do produto
  (verde-menta = vitalidade, laranja = energia/caloria) e o `@theme` do Tailwind aponta para os
  mesmos `--bd-*` — sem duplicar paleta em dois lugares. Tema controlado via `data-theme` no
  `documentElement` (`ThemeService` em `core/layout/theme.service.ts`), persistido em
  `localStorage`, com script anti-flash no `index.html`.
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
  (pôster de feira livre — manga/ameixa/creme), diferente do resto do app (verde-menta/laranja).
  Em vez de duplicar layout, `shared/organisms/auth-poster-layout/` sobrescreve os tokens `--bd-*`
  só no próprio `:host` (custom properties herdam pela árvore do DOM, independente de view
  encapsulation) — os componentes `bd-field`/`bdInput`/`bdButton` projetados dentro saem retemados
  sem tocar no tema global. Esse é o padrão a seguir sempre que uma tela precisar de uma paleta
  isolada sem reescrever os componentes da lib.

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
| User | `/api/users`, `/api/user/{id}`, `PUT /api/user/{id}` (multipart, avatar), `/api/user/update-profile-pic/{id}`, `/api/user/delete-profile-pic/{id}` | `name, email, password, data_nascimento, genero, peso, altura, avatar, nivel_atividade, objetivo`. |

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
3. Recomendação nutricional + Metas diárias (base numérica do dashboard) — ✅ feito.
4. Alimentos (CRUD) — valida o padrão lista+form antes de dietas/registro.
5. Diário/Registro — feature central do produto.
6. Dashboard (meta vs. consumido).
7. Dietas (planos reutilizáveis).
8. Perfil (dados pessoais + avatar).
9. Polimento transversal (onboarding, estados vazios, a11y, testes essenciais) — intercalado com as demais.
