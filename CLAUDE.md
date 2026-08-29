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
- **Tailwind v4** (CSS-first, sem `tailwind.config.js`) — `@use "tailwindcss";` no `styles.scss`
  (`@use`, não `@import`: Sass deprecou `@import` e gera warning de build). **Exige
  `.postcssrc.json`** na raiz do projeto (`{ "plugins": { "@tailwindcss/postcss": {} } }`) —
  achado corrigindo 2026-08-13 (ver "Bug crítico" abaixo): sem esse arquivo, o `@angular/build`
  não ativa o pipeline do PostCSS/Tailwind, e nenhuma classe utilitária é gerada (só o preflight
  estático do pacote, copiado literalmente pelo Sass, sobrevive). **Preferir classe Tailwind a
  CSS/SCSS próprio sempre que a classe existir** — utilitária direto (`flex`, `gap-4`, `rounded-
[20px]`), token do design system mapeado em `@theme` (`bg-surface`, `text-fg-muted`, `border-
primary`), ou arbitrária (`text-[11px]`, `grid-cols-[224px_minmax(0,1fr)_296px]`,
  `group-[.active]:text-primary-strong`, `enabled:hover:border-primary`,
  `focus-visible:[box-shadow:var(--bd-focus-ring)]`). SCSS de componente fica só pro que Tailwind
  genuinamente não expressa — na prática, quase sempre `:host-context()`/custom property herdada
  entre componentes (ver `metas-page.component.scss`, reduzido a só a variável `--fat`).
- **ngx-toastr** `^19` (não a última major — `^20` exige Angular 21) + `@angular/animations`
  (`provideAnimations()`), configurados em `app.config.ts`, não em `main.ts`.
- **Lucide** (`@lucide/angular`) para ícones — trocou o Font Awesome Free em 2026-08-13 (todo
  ícone do sistema, sem exceção: menu lateral, topbar, tema claro/escuro, navegação do quiz de
  Metas). Cada ícone é seu próprio componente standalone com seletor de atributo — estático
  (`<svg lucideCheck aria-hidden="true"></svg>`, importa `LucideCheck` no `imports` do
  componente) ou dinâmico quando o ícone varia por item de uma lista (`<svg [lucideIcon]="item.icon">`,
  componente `LucideDynamicIcon`, usado no menu lateral — ver `app-shell.component.ts`). Sem
  módulo global nem CSS: só entra no bundle o ícone realmente importado, ao contrário da folha
  inteira do Font Awesome — trocar tirou **1.5MB** do bundle inicial (1.93MB → 418kB), por isso o
  budget de produção voltou ao padrão do Angular (500kB/1MB) em vez do 700kB/1.2MB inflado que a
  fonte de ícones antiga exigia.
- **TypeScript strict** (o `tsconfig.json` gerado pelo `ng new` do Angular 20 já vem estrito o
  suficiente: `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`,
  `strictTemplates`, `strictInjectionParameters`).
- Testes: Jasmine/Karma (padrão do `ng new`, mesmo setup do portfólio).
- **i18n via `@jsverse/transloco`** (pt-BR/en-US, ver "i18n" abaixo) — não é mais só PT-BR.
- **Toda subscription de chamada à API é encerrada ao sair do componente** — nunca deixar um
  `.subscribe()` órfão. Padrão do projeto: `Subject<void>` privado (`destruido`), `implements
OnDestroy`, `ngOnDestroy() { this.destruido.next(); this.destruido.complete(); }`, e
  `takeUntil(this.destruido)` em **todo** `.pipe()` antes do `.subscribe()` — mesmo em chamadas
  que parecem rápidas (um `POST` que só demora um pouco mais que a navegação do usuário ainda
  escreve num signal de componente destruído se não for cortado). Referência:
  `EntryComposerComponent`, `DietaFormComponent`. Não usar `takeUntilDestroyed()` (built-in do
  Angular) — o projeto já tem o padrão manual estabelecido, não misturar os dois estilos.

## Como rodar

```bash
npm install
npm start          # http://localhost:4200
npm run build
npm test

npm run app:sync   # ng build + cap sync android (sempre que o web mudar)
npm run app:android # o anterior + abre o projeto no Android Studio
```

O app Android exige **Android Studio (Otter 2025.2.1+) e JDK 17** instalados. O backend precisa
liberar as origins do WebView no CORS (`http://localhost` e `capacitor://localhost`, já fixas em
`config/cors.php`); origins extras entram por `FRONTEND_ORIGINS` (CSV).

Backend em paralelo, em `../vitality-Back`:

```bash
php artisan serve  # http://localhost:8000
```

O `.env` do backend precisa ter `FRONTEND_URL=http://localhost:4200` (necessário para o CORS
liberar o Angular — o `config/cors.php` do backend só aceita **uma** origin por vez).

## Estrutura de pastas

Onde cada arquivo mora, critério de organização (feature vs. `components/`), regra pra service —
tudo isso vive em **[`ESTRUTURA.md`](./ESTRUTURA.md)**, não aqui. Ao criar pasta nova ou mudar
critério de organização, atualize lá, não aqui.

## Decisões de arquitetura

- **App nativo é Capacitor, não Ionic** (2026-08-29). O mesmo bundle Angular roda no navegador e
  dentro do WebView; `android/` é versionado ao lado de `src/`, e `npm run app:sync`
  (`ng build && cap sync android`) é o caminho único de atualização. **Nenhum componente do Ionic
  Framework entra**: adotá-los significaria descartar bandeira-ui + Tailwind + as 4 paletas — dois
  design systems disputando token de cor. O que a web não entrega (push, câmera, deep link, botão
  voltar) vem de plugin, não de UI pronta. O que muda de comportamento entre as duas plataformas
  vive em `core/platform/` e é sempre no-op no navegador — nunca espalhar `Capacitor.isNative*()`
  pelos componentes; perguntar ao `PlatformService`.
  - **O token não mora mais em `localStorage` cru**: `core/auth/token.store.ts` guarda no
    `Preferences` (no Android, `SharedPreferences` — fora do alcance de uma limpeza de dados do
    WebView). Como o `Preferences` é assíncrono e o `authInterceptor` roda no caminho síncrono de
    toda requisição, o valor vive num **signal em memória**: quem lê, lê do signal; a persistência
    acontece em segundo plano. O `provideAppInitializer` hidrata o signal **antes** do
    `restoreSession()` — invertido, a primeira requisição sai sem `Authorization`. Sem token
    guardado, `restoreSession()` nem é chamado (numa rede móvel, um 401 garantido só atrasa a
    primeira tela). A chave mudou de nome (o plugin prefixa com `CapacitorStorage.`), então o
    `load()` migra a chave antiga uma vez — sem isso, subir esta versão deslogaria todo mundo que
    já usava a web. Coberto por `token.store.spec.ts`.
  - **Expirar por ociosidade é comportamento de navegador**: `SessionInactivityService` não arma no
    app. Num aparelho pessoal, os 30 min só obrigariam a relogar a cada reabertura — o aparelho já
    tem tela de bloqueio. O que substitui é revalidar a sessão no `appStateChange`.
  - **O botão físico de voltar tem uma ordem fixa**: fecha overlay (`OverlayStackService`) → navega
    para trás → na raiz, sai só no segundo toque (toast "toque de novo para sair", padrão Android).
    Componente com camada dispensável se registra na pilha via `effect` + `onCleanup`; a pilha só
    sabe fechar, não sabe o que a camada é.
  - **A landing não entra no app** (`nativeLandingGuard`): ela existe para converter visitante na web
    aberta; quem abriu o app já instalou.
  - **A inicialização nativa fica em `app.config.ts`, não no componente raiz.** Injetar o
    `NativeShellService` em `App` arrastaria `AuthService`/`HttpClient` para a árvore de
    dependências do casco vazio — e quebrou `app.spec.ts` na hora. `provideAppInitializer` resolve
    sem acoplar nada.
  - **Fraunces é auto-hospedada** (`public/fonts`, `@font-face` no `styles.scss` com caminho
    raiz-relativo `/fonts/…`, que o builder do Angular preserva): sem rede no primeiro boot, o CDN
    do Google deixaria a marca sem tipografia. Sem `preload` de propósito — hoje só a landing usa
    Fraunces, e o navegador só baixa o woff2 quando um glifo casa com o `@font-face`. Um arquivo por
    estilo: sendo fonte variável, 600 e 700 são byte a byte o mesmo woff2.

- **Bug crítico corrigido: Tailwind não gerava nenhuma classe utilitária** (2026-08-13, achado
  migrando o SCSS de Metas pra Tailwind). Causa raiz: o `@angular/build` só ativa o pipeline do
  PostCSS/Tailwind automaticamente se encontrar um `tailwind.config.{js,cjs,mjs,ts}` na raiz — e
  este projeto é CSS-first, sem esse arquivo por decisão (ver Stack). Sem ele, `initPostcss()`
  (em `@angular/build`) nunca roda o PostCSS, e o `@use "tailwindcss";` do `styles.scss` só faz o
  Sass copiar o CSS estático do pacote (`@theme default` com a paleta default da lib + o preflight
  — por isso a página nunca pareceu quebrada, só nunca teve as classes utilitárias de verdade).
  Corrigido com `.postcssrc.json` na raiz (`{ "plugins": { "@tailwindcss/postcss": {} } }`) —
  `@angular/build` também procura por esse arquivo (`postcss.config.json`/`.postcssrc.json`,
  formato JSON puro) independente de `tailwind.config.*` existir. Verificado no CSS compilado
  (`dist/.../styles.css`) que classes reais passaram a existir depois da correção. Como o bug era
  silencioso (nenhum erro de build, só ausência de estilo), **qualquer suspeita de "classe
  Tailwind não aplicou" deve primeiro conferir se `.postcssrc.json` existe e se o CSS compilado
  realmente contém a classe** antes de desconfiar da classe em si.
- **Tokens únicos**: `--bd-*` (definidos pela bandeira-ui) são a fonte de verdade visual.
  `src/styles.scss` sobrescreve os `--bd-*` default com a paleta do produto e o `@theme` do
  Tailwind aponta para os mesmos `--bd-*` — sem duplicar paleta em dois lugares. Tema controlado
  via `data-theme` no `documentElement` (`ThemeService` em `core/layout/theme.service.ts`),
  persistido em `localStorage`, com script anti-flash no `index.html`.
- **Paletas trocáveis do sistema** (2026-08-13): a antiga "Cozinha Quente" coral foi substituída
  por Horta (default), Especiaria, Sálvia e Ameixa Reversa. `PaletteService` persiste a escolha em
  `localStorage` (`palette`) e sincroniza `data-palette` no `documentElement`; o script anti-flash
  do `index.html` aplica a escolha antes do Angular iniciar. Cada paleta altera somente
  `--bd-primary*` e `--sidebar-*`; accent e neutros continuam variando exclusivamente com o tema.
  A escolha vale para o sistema inteiro, inclusive login e cadastro.
- **Auth via Bearer token puro** (Sanctum), sem cookies/CSRF — mesmo com
  `supports_credentials: true` no CORS do backend, não é necessário `withCredentials`.
- **`authInterceptor`** só anexa `Authorization` em requests para `environment.apiBaseUrl` — nunca
  nas rotas de auth (`environment.apiUrl`, sem `/api`).
- **`errorInterceptor`** trata 401 em rota protegida como sessão expirada (logout + redirect
  `/login`) e qualquer outro erro com toast genérico — exceto nas rotas de login/registro, que
  tratam o próprio erro por campo (ver contrato abaixo).
- **Sessão restaurada no boot**: `provideAppInitializer` chama `AuthService.restoreSession()`
  antes da primeira navegação, para um refresh de página não deslogar quem já tinha token válido.
- **Auth herda a identidade ativa**: a decisão anterior de manter a paleta isolada "Feira
  Vitality" em login/registro foi revertida. `auth-poster-layout/` não sobrescreve mais tokens
  `--bd-*`: seu pôster usa `--sidebar-bg` e os CTAs/formulários usam os tokens globais da paleta
  ativa. Como custom properties herdam pela árvore do DOM mesmo com view encapsulation, login e
  cadastro acompanham imediatamente a paleta escolhida no restante do app.
- **Menu lateral não usa `BdAppShellComponent`**: o layout desejado (sidebar de altura cheia +
  topbar só na coluna de conteúdo) não bate com a estrutura fixa da lib (header full-width acima
  de tudo). `core/layout/app-shell/` é markup próprio, reaproveitando só os átomos da lib
  (`bd-avatar`, `bdButton`, `bdTooltip`). A cor de fundo do menu usa os tokens globais
  `--sidebar-*`, definidos por `data-palette` e compartilhados com o pôster de auth; continua
  sendo chrome separado de `--bd-bg`, pois esse último é lido pelo `bd-input` como o próprio fundo
  de campo e nunca deve ser reaproveitado para pintar um painel escuro.
  Gaveta mobile (<900px) implementada à mão (sem a gaveta pronta da lib) — `mobileMenuOpen` signal
  - scrim + fecha em `Escape`. Falta ainda: foco preso dentro da gaveta enquanto aberta (Fase 9).
- **Todo botão é pill (raio total), sem exceção**: decisão de produto (2026-08-13), não só do
  quiz de Metas. `button[bdButton], a[bdButton] { border-radius: 999px !important; }` em
  `src/styles.scss` — `!important` porque o raio do `bdButton` vem do host da própria lib
  (`--bd-radius-sm`), token que também dá forma a chip/tab/skip-link; mexer nele quebraria essas
  outras peças, então a sobrescrita mira só `[bdButton]`. Navegação de passo (voltar/avançar) vai
  além do raio: é **sempre** um par de botões redondos só-ícone — nunca texto/link — avançar em
  `--bd-primary` sólido, voltar em contorno neutro (`--bd-border-strong`, hover primary). Ver
  `StepFooterComponent` (`.round-back`/`.round-next`) como referência do padrão.
- **Painel inicial de Metas ("configurado") é "cabeçalho conectado"** (2026-08-13, escolhido entre
  4 conceitos): título+subtítulo e a ação principal vivem na mesma faixa no topo (`.hero-row`),
  ecoando a gramática da topbar do app-shell (rótulo à esquerda, botão à direita, uma linha só) —
  substituiu o hero de duas colunas (texto vs. card) da passada anterior. O card abaixo
  (`.hero-card`) não repete título nem texto, só o resultado (`vtp-macro-summary` tamanho `xl`).
  "Refazer metas" é ação secundária de propósito: `bdButton variant="ghost"` (tom neutro do
  design system, não a cor primária), centralizada abaixo do card — depois do resultado, não ao
  lado da ação principal, pra não competir peso visual com "Ir para o painel".
- **Ícone de emoji/caractere solto nunca é ícone** — sempre um ícone de verdade da lib (Lucide,
  ver Stack). Achado revisando o quiz de Metas: `✓` e `→` como texto solto no template viraram
  `<svg lucideCheck>`/`<svg lucideArrowRight>`.
- **Todo ícone do sistema é Lucide, sem exceção** (2026-08-13) — inclusive o par sol/lua do botão
  de tema e as setas do rodapé do quiz (`StepFooterComponent`), que antes eram SVG inline
  desenhado à mão (linework fino, documentado como exceção "até o resto do app migrar pra esse
  estilo"). Agora não é mais exceção: `LucideSun`/`LucideMoon`/`LucideArrowLeft`/
  `LucideArrowRight`/`LucideCheck`, todos com o mesmo `stroke-width` padrão da lib — um set só,
  em vez de dois estilos de ícone coexistindo. Rodapé do quiz usa seta reta
  (`LucideArrowLeft`/`LucideArrowRight`), não chevron — decisão de estilo, não falta do ícone
  certo. Estado final do botão de avançar (`ultimo()`, "Salvar") não tem cor própria — cai no
  mesmo `--bd-primary` do botão padrão, nunca verde/`--bd-success` (isso já foi um bug: usar uma
  cor semântica fora da paleta de marca num CTA que não é indicador de status).
- **Todo estado de carregamento do sistema é o "Prato Servindo"** (2026-08-15). Antes conviviam
  três linguagens incompatíveis (spinner Lucide no `step-footer`, spinner interno do `bdButton`, e
  `[disabled]` + troca de texto sem indicador nenhum em Dietas), além de esperas sem feedback algum
  — boot em tela branca, troca de rota congelando a tela, gerar plano de dieta só apagando um botão.
  Escolhido entre 6 conceitos comparados em artefatos. Peças:
  `components/atoms/plate-loader/` (o desenho, em 4 escalas), `components/molecules/loading-state/`
  (prato + título + descrição, para tela/seção), `components/organisms/loading-overlay/` (scrim para
  ação longa) e `components/utils/loading-gate.util.ts` (anti-flicker). Regras que não podem ser
  quebradas ao mexer nisso:
  - **`cor="herdada"` sempre que o prato estiver sobre superfície primary** (dentro de `bdButton`
    cheio, do `.round-next` do `step-footer`, de qualquer botão sólido). O default é
    `--bd-primary`, e primary sobre primary é invisível. Não dá pra resolver com herança de CSS:
    uma declaração de `color` no `:host` **sempre** vence o valor herdado do pai — por isso é um
    input explícito, não mágica.
  - **O gate de anti-flicker é um util, não estado interno do componente.** `gateCarregamento()`
    converte o signal cru num signal de exibição (250ms de atraso, 400ms de permanência mínima) e
    **o template inteiro pendura nele** (`@if (xVisivel()) {} @else {}`). Tentar guardar isso dentro
    do componente de loading não funciona: quem decide renderizar loader ou conteúdo é o `@if`/
    `@switch` do pai, que troca de branch na hora — o loader apareceria por cima da página já
    pintada. O signal **cru** continua valendo para `disabled`, guard e regra de negócio (senão dá
    pra clicar "próxima página" durante os 250ms).
  - **Reduced-motion desliga a animação pelo NOME** (`animation-name: none`), nunca sobrescrevendo o
    `transform`: declaração de animação vence declaração normal, e a guarda global do `styles.scss`
    (que só encurta a duração para 0.01ms) faria a animação parar no último keyframe — o prato
    **vazio**. Com o nome desligado, o valor estático (`translateY(52px)`, meio cheio) volta a valer.
  - **`role="status"` só no `vtp-loading-state`**; o `plate-loader` entra `aria-hidden` quando não
    recebe `rotulo`. Nunca aninhar dois `role="status"`. Em botão, o estado é anunciado por
    `aria-busy` no próprio botão.
  - **`bdButton` não usa mais `[loading]`** — usa `[disabled]` + `[attr.aria-busy]` + o prato
    projetado dentro. O `[loading]` da lib renderiza um `<span>` vazio estilizado por CSS; virar
    prato ali exigiria redesenhar o prato em `mask-image`, ou seja, um segundo desenho fora de
    sincronia com o SVG do componente — exatamente o que o conceito único existe para evitar.
  - **Catálogo de alimentos tem regra própria**: primeira carga (lista vazia) mostra o prato;
    recarga (paginar/filtrar/ordenar) mantém os cards no lugar e só os esmaece
    (`.food-grid--recarregando`), com um prato `xs` na barra de resultados. Os 6 blocos de
    `.food-skeleton` foram removidos — trocar uma lista cheia por blocos vazios a cada clique de
    página era pior que esperar sobre o conteúdo. Isso também consertou um bug silencioso: em modo
    Tabela o `@if (carregando())` desmontava a tabela inteira, então a máscara do `p-table`
    (`[loading]`, linha 160) nunca chegava a aparecer.
  - **O splash do `index.html` é cópia consciente do componente.** Precisa existir antes de qualquer
    JS de aplicação, então duplica o SVG e as keyframes; some sozinho porque o Angular faz
    `textContent = ''` no host ao criar o componente raiz (`dom_renderer.mjs`, `selectRootElement`).
    Se um dia ligarem SSR/hydration, `PRESERVE_HOST_CONTENT` vira `true` e o splash **não** será
    removido. O fade de entrada usa `animation-delay`, não duração, porque a guarda global de
    reduced-motion zera durações mas não atrasos — sem isso o splash piscaria no login (sem token,
    `restoreSession()` resolve síncrono).
- **`card` — ver "Design tokens" abaixo.**
- **Rodapé do quiz volta a ficar em fluxo normal — não trava mais posição** (2026-08-13, revertido
  na mesma sessão): chegamos a implementar altura fixa no card + `.step-body` com `overflow-y:
auto` pra o rodapé nunca mudar de linha entre passos. Revertido depois de analisar
  `step-accordion` do collab-creators-ui (`C:\Users\JP\collab-creators-ui\src\app\components\step\
step-accordion`, referência apontada pelo usuário como boa usabilidade): lá o rodapé **também**
  muda de posição — o card do passo aberto (`step-content-panel`) só cresce/encolhe livre, sem
  altura fixa nem scroll interno. A usabilidade boa não vem de rodapé imóvel, vem da lista de
  passos rica ao lado (ver "Navegação em steps ricos" no roadmap, Fase 3). Lição: quando for buscar
  referência externa, ler a implementação de verdade antes de copiar a _sensação_ — a suposição
  inicial (rodapé fixo = boa UX) não batia com o que a própria referência fazia.

## Design tokens — paletas do sistema

Fonte de verdade: `src/styles.scss`. `:root` e `:root[data-theme='dark']` definem neutros e accent;
os blocos `data-palette` definem primary e sidebar (com espelho para preferência escura do sistema).
Qualquer artefato, mockup ou tela nova **usa exatamente estes valores** — não inventar tom novo
"parecido".

**Classe `card`** (`@utility card` em `src/styles.scss`, Tailwind v4 custom utility — `class="card"`
em qualquer template do projeto): primitivo de fundo pra **qualquer** tela do sistema com mais de
uma sub-área visual (steps, painéis, cards internos) — não é específico de nenhuma feature, apesar
de ter nascido resolvendo um bug no quiz de Metas. Tira o conteúdo de cima do `--bd-bg` da página e
dá um plano próprio pra desenhar em cima. Só define o casco (`background-color: var(--bd-surface);
border: 1px solid var(--bd-border); border-radius: 20px`) — **nunca** embute padding, porque o
padding certo muda por contexto (painel lateral raso ≠ card de conteúdo principal). **Toda vez que
aplicar `card`, somar padding junto** (`p-6`, `py-9 px-8`...) — nunca deixar um `card` pelado; foi
exatamente isso que faltou quando a grade de 3 colunas do quiz de Metas virou `card` sem padding
nenhum, e o conteúdo do meio encostou direto na borda externa, sem respiro. Cards podem aninhar
(o quiz tem `card` externo + `card` em cada coluna interna) desde que cada nível tenha seu próprio
padding entre a borda e o conteúdo/próximo card.

| Token                                                                 | Light                                                                             | Dark                                                                              | Uso                                                                                                                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bd-bg`                                                             | `#f7f1e4`                                                                         | `#171410`                                                                         | Fundo da página. **Também é o fundo que `bd-input` usa pra si mesmo** — nunca reaproveitar pra pintar um painel/chrome escuro (bug já cometido na Fase 1). |
| `--bd-surface` / `--bd-bg-elevated`                                   | `#fffdf7`                                                                         | `#201c14`                                                                         | Cards, campos, superfícies elevadas.                                                                                                                       |
| `--bd-surface-hover`                                                  | `#f2e9d4`                                                                         | `#29241a`                                                                         | Hover de linha/item.                                                                                                                                       |
| `--bd-border`                                                         | `#eae0c8`                                                                         | `#362f22`                                                                         | Borda padrão.                                                                                                                                              |
| `--bd-border-strong`                                                  | `#d9c9a0`                                                                         | `#4a4030`                                                                         | Borda em hover/foco.                                                                                                                                       |
| `--bd-fg`                                                             | `#2b2417`                                                                         | `#f3eedf`                                                                         | Texto principal.                                                                                                                                           |
| `--bd-fg-muted`                                                       | `#786d54`                                                                         | `#b3a88f`                                                                         | Texto secundário/legenda.                                                                                                                                  |
| `--bd-fg-subtle`                                                      | `#a99d7e`                                                                         | `#7d735c`                                                                         | Placeholder, texto terciário.                                                                                                                              |
| `--bd-primary`                                                        | Horta `#5c7a3f`; Especiaria `#a9673a`; Sálvia `#7c9473`; Ameixa Reversa `#6b3f57` | Horta `#7c9a5c`; Especiaria `#c2814f`; Sálvia `#9bb18f`; Ameixa Reversa `#8c5d76` | Ação principal, CTA, estado ativo.                                                                                                                         |
| `--bd-primary-strong` / `--bd-primary-soft` / `--bd-primary-contrast` | Derivados da paleta clara ativa                                                   | Derivados da paleta escura ativa                                                  | Hover, fundo suave e contraste do primary.                                                                                                                 |
| `--bd-accent`                                                         | `#d9a441` (mostarda)                                                              | `#e8be5d`                                                                         | Destaque secundário — nunca disputa com o primary na mesma composição.                                                                                     |
| `--bd-accent-soft`                                                    | `rgba(217,164,65,.16)`                                                            | `rgba(232,190,93,.18)`                                                            | Fundo suave do accent.                                                                                                                                     |
| `--bd-danger`/`--bd-warning`/`--bd-success`                           | defaults da lib (não sobrescritos)                                                | idem                                                                              | Semântico — separado do accent de marca, não usar primary/accent pra status.                                                                               |
| `--sidebar-*`                                                         | Horta `#33421f`; Especiaria `#4a2f3e`; Sálvia `#33302a`; Ameixa Reversa `#5a3826` | mesmo                                                                             | Chrome do menu e fundo do pôster de auth; `fg`, `fg-muted` e `bg-hover` derivam de cada paleta.                                                            |
| `--bd-radius`                                                         | `0.875rem`                                                                        | idem                                                                              | Raio padrão de card/botão/input.                                                                                                                           |

Tipografia: `--bd-font-sans` (herdado da lib, `'Inter', system-ui, ...` — sem `@font-face`
próprio, cai pro stack do sistema na prática). Números tabulares (`font-variant-numeric:
tabular-nums`) em qualquer lugar com dígito alinhado em coluna (macros, calorias, tabelas).

**Mapeamento de cor para macros** (gráficos/anéis de proteína·carbo·gordura — Metas, Diário,
Dashboard): proteína = `--bd-primary` (paleta ativa), carboidrato = `--bd-accent` (mostarda), gordura =
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

| Rota                                            | Observação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/login`                               | Responde `{status, token, user, message}` em 201. **401** = senha errada, **404** = e-mail não encontrado — tratado por campo no formulário (`LoginComponent`), não como toast genérico. Testado ponta a ponta contra o backend real.                                                                                                                                                                                                                                                               |
| `POST /api/criar-usuario`                       | `UserController::storeUser` — **não usar `/register`** (scaffold Breeze, sessão). Exige `name, email, password, password_confirmation` (regra `confirmed` no backend — o front valida os dois lados também, `RegisterComponent`). Resposta confirmada: `{message, data: User, success}`, **sem token** — nunca autentica direto, sempre redireciona pro `/login` depois de criar a conta. Dispara seed de refeições/alimentos padrão pro novo usuário. Testado ponta a ponta contra o backend real. |
| `POST /forgot-password`, `POST /reset-password` | Fluxo de recuperação de senha do Breeze — não usado por este front.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `POST /logout`                                  | Continua em `routes/auth.php` (guard `web`), **não confiável com Bearer token** — não foi movida (baixo risco, já tratada como best-effort). Tratar logout como client-side (apagar token, redirecionar).                                                                                                                                                                                                                                                                                           |

### Tudo mais — sob `/api`, protegido por `auth:sanctum`, header `Authorization: Bearer <token>`

Resposta geralmente `{data, success, message?}`. Listas do catálogo de alimentos são paginadas no formato Laravel (`data`, `meta`, `links`).

| Recurso      | Rotas                                                                                                                                                                               | Campos / observações                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Me           | `GET /api/user/get-with-token`                                                                                                                                                      | Usuário autenticado a partir do token.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Alimento     | `GET /api/foods`, `GET /api/foods/{id}`, favoritos em `/api/foods/{id}/favorite`                                                                                                    | Catálogo global curado: `descricao, proteina, gordura, caloria, carbo, qtd, fonte, grupo, status`; o detalhe também devolve nutrientes dinâmicos. TACO é a base brasileira inicial (597 itens, por 100 g) e USDA Foundation Foods complementa o catálogo com nutrientes detalhados. Usuário comum só busca itens ativos e mantém favoritos em `user_foods`. Não há cadastro pessoal. Admin usa `/api/admin/foods` para criar/editar, arquivar/restaurar e reimportar TACO. Registro alimentar persiste snapshot de macros para não reescrever histórico após correções de catálogo.                                                                                                                                                                                                                                                                                                                                                                                                           |
| Refeição     | `/api/refeicao[/{id}]`                                                                                                                                                              | `descricao, horario` — é o _tipo_ de refeição (ex. "Café da manhã"), não o que foi comido.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Dieta        | `/api/dieta[/{id}]`                                                                                                                                                                 | `descricao, id_refeicao, alimentos:[{id,qtd}]` — plano reutilizável. `index` já retorna totais agregados.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Diário       | Canônico: `GET /api/diary/day?date=YYYY-MM-DD`, `POST /api/diary/entries`, `PATCH /api/diary/entries/{entry}`, `DELETE /api/diary/entries/{entry}`; refeições em `/api/diary/meals` | Cada lançamento tem `meal_id`, `consumed_at` e `items:[{food_id,quantity}]`; há vários lançamentos por refeição/dia. A data nutricional usa `America/Sao_Paulo`, consumo futuro é recusado e itens repetidos são consolidados. Macros e micronutrientes são snapshotados no pivô, portanto mudanças do catálogo nunca reescrevem o histórico. `/api/registro` e `/api/refeicao` continuam temporariamente como adaptadores legados.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Meta diária  | `/api/meta[/{id}]`                                                                                                                                                                  | `meta_calorias, meta_proteinas, meta_carboidratos, meta_gorduras, data?`. O backend não impede duplicatas, mas o front trata a meta com `data: null` como "a vigente" e faz upsert nela (`MetaService.save`) — evita acumular registros a cada salvamento.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Recomendação | `/api/recomendacao[/{id}]`                                                                                                                                                          | `get` (Gasto Energético Total), `tmb` (Taxa Metabólica Basal), `caloria, proteina, carbo, gordura`. **1 por usuário** — `POST` dá 400 se já existe. Em vez de reagir ao 400, `RecomendacaoService.save` sempre consulta o `index` antes e decide `POST`/`PUT` — mais previsível. `shared/utils/recomendacao-calc.util.ts` calcula uma sugestão inicial (TMB Mifflin-St Jeor + fator de atividade) a partir do perfil do usuário (peso/altura/idade/gênero/atividade/objetivo — campos da Fase 8); sem esses dados, o formulário fica em preenchimento manual.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| User         | `/api/users`, `/api/user/{id}`, `PUT /api/user/{id}`, `POST /api/user/avatar`, `DELETE /api/user/avatar`                                                                            | `name, email, password, data_nascimento, genero, peso, altura, avatar, nivel_atividade, objetivo`. **`name` e `email` são obrigatórios em TODO `PUT`**, mesmo atualizando só outro campo — `UserService.updateProfile()` sempre inclui os dois a partir de `AuthService.currentUser()`. O avatar é do usuário autenticado (sem `id` na URL), usa `FormData` no campo `avatar` (JPEG/PNG/JPG/GIF, até 2 MB), `UpdateUserAvatarRequest` para validação, `UserAvatarService` para troca/remoção atômica no disco `public` e `UserResource` para devolver URL pública estável. O banco guarda apenas o caminho relativo. Corrigido em 2026-08-13: o `update()` fazia `$user->update([...$request->campo])` com todo campo ausente virando `null`, **apagando o resto do perfil a cada PUT parcial** (achado ao implementar o quiz de Metas — passo 2 zerava peso/altura salvos no passo 1). Agora usa `$request->only([...])`, que só toca nos campos realmente enviados — testado ponta a ponta. |

Todos os caminhos acima são centralizados em `core/http/api-paths.ts` (`authPaths` / `apiPaths`) —
usar sempre essas funções em vez de montar strings de URL na mão.

### Catálogo e testes

- O catálogo TACO é carregado pelo `TacoFoodSeeder`, chamado por `DatabaseSeeder`; inicialize um
  ambiente novo com `php artisan migrate --seed`. A carga é idempotente e pode ser repetida.
- A importação complementar da USDA Foundation Foods é explícita: baixe o JSON oficial em
  `storage/app/imports/usda/foundation-2026-04-30/` e execute
  `php artisan foods:import-usda --dataset=foundation`. O comando também suporta a base histórica
  opcional SR Legacy (`--dataset=sr-legacy`); cada alimento guarda a referência e todos os nutrientes
  são normalizados em `nutrientes` e `alimento_nutrientes`.
- Os testes **nunca** podem usar PostgreSQL de desenvolvimento: `phpunit.xml` e `.env.testing`
  fixam SQLite em memória, e `Tests\TestCase` aborta a suíte se outra conexão for selecionada.
- Promova a primeira conta administrativa com `php artisan user:make-admin email@dominio.com`.
- Todo usuário recebe cinco refeições padrão pessoais (Café da manhã, Almoço, Lanche da tarde,
  Jantar e Ceia). Elas podem ser editadas, ordenadas ou arquivadas; o lançamento preserva o nome e
  horário daquele momento para não alterar o passado.

### Inconsistências conhecidas do backend (o front contorna, não corrige — fora de escopo por ora)

- `/logout` real é sessão Breeze, incompatível com Bearer token (única rota de auth que não foi
  movida pro grupo `api` — ver acima).
- Falta checagem de "dono do recurso" em alguns `show`/`update`/`destroy` (ex. `AlimentoController`,
  `DietaController`, `RefeicaoController`) — qualquer usuário autenticado pode, em teoria, acessar
  recurso de outro por ID.
- Os endpoints legados `/food` foram aposentados pelo catálogo global `/foods`; não reintroduzir
  alimentos por usuário nem a cópia da TACO no cadastro.

## i18n

Dois locales: `pt-BR` (default) e `en-US`, via `@jsverse/transloco`.

- **Mecanismo**: `LanguageService` (`core/i18n/language.service.ts`) guarda o locale ativo num
  signal (`locale`, readonly) e no `localStorage` (`vitality-language`); `setLanguage()` chama
  `TranslocoService.setActiveLang()`. `localeInterceptor` (`core/i18n/locale.interceptor.ts`) lê o
  `localStorage` e manda `Accept-Language: pt-BR|en-US` em toda chamada pra `apiBaseUrl` — o
  backend (`SetLocale` middleware) usa esse header pra resolver `app()->getLocale()` e traduzir o
  que devolve (nome/detalhe/categoria de alimento, nome de refeição, mensagens de validação, texto
  gerado por IA no plano alimentar). Trocar o idioma **não recarrega a página** — é só o signal
  mudando — então nada que já foi buscado antes da troca se retraduz sozinho.
- **Textos estáticos da UI**: `public/i18n/{pt-BR,en-US}.json`, chaves lidas via `TranslocoPipe`
  (`{{ 'namespace.chave' | transloco }}`, reativo à troca de idioma) ou, quando o valor precisa
  virar array/string resolvida em TS (loading-overlay, toasts, `StepTrackComponent[steps]`),
  `TranslocoService.translate()` dentro de um `computed()` que lê `language.locale()` no topo —
  só assim o `computed` reroda quando o locale muda (ver `PageTitleComponent`/`LoadingStateComponent`
  pro padrão mais antigo — de-para de texto literal pra chave — e `EstiloStepComponent`/
  `DietaFormComponent` pro padrão novo, direto por chave).
- **Dado já buscado não se retraduz sozinho** (achado implementando Dietas, 2026-08-18): qualquer signal preenchido por uma resposta da API (ex. `draft()` com o plano
  alimentar gerado — nomes de refeição e de alimento embutidos no JSON) fica **congelado** no
  idioma que estava ativo no momento da chamada. Trocar o idioma depois não muda o que já está na
  tela. Onde isso importa (telas que mantêm dado de catálogo/plano vivo na tela por muito tempo),
  reagir à troca com um `effect()` que recarrega/retraduz:
  - **Lista simples** (`AlimentosListComponent`): só re-chama `load()`/`loadGrupos()` — a API já
    devolve tudo nas descrições certas, não tem "estado" a preservar.
  - **Plano alimentar já gerado** (`DietaFormComponent`): recarregar do zero regeneraria a
    composição (outros alimentos, não só outro idioma) — errado. O backend expõe
    `POST /meal-plans/preview/refresh-locale` (`MealPlanService.refreshLocale()`), que retraduz o
    **mesmo** draft (mesmos alimentos/quantidades/IDs, só o texto de exibição) sem chamar a IA de
    novo. `DietaFormComponent` chama isso só quando `mode()==='preview'` e existe `draft()`.
  - Todo `effect()` de troca de idioma pula o primeiro disparo (roda uma vez ao montar o
    componente) com uma flag (`idiomaInicializado`) — senão duplica a carga inicial que o
    `constructor()` já dispara.

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
   Quarta passada — layout "Painel Vivo" (2026-08-13): a tela não usava a largura do shell (card
   único de 840px centralizado) e os 4 passos apareciam soltos, sem hierarquia. Virou grid de 3
   colunas ocupando a largura toda: etapas categorizadas (`Você` · `Rotina & meta` · `Resultado`,
   `categorias: CategoriaPasso[]` em `MetasPageComponent`) à esquerda, conteúdo do passo no meio,
   e um painel de resumo fixo (`.summary-col`, sticky) à direita que reage ao progresso — anel e
   chips saem de "—" pros valores reais assim que a sugestão é calculada, com uma frase de
   contexto (`storyText` computed, muda por passo) entre o anel e os chips. A tira fina
   (`.panel-strip`) que ficava em cima do form foi removida — o painel de resumo lateral substitui
   ela. `bd-steps` foi trocado por markup próprio (`nav > .step-group > .step-item`) porque a lib
   não suporta cabeçalho de grupo — mesma lição do menu lateral (CLAUDE.md, seção "Decisões de
   arquitetura"): quando a estrutura da lib não bate com o layout, markup próprio reaproveitando só
   os tokens, não a gambiarra de forçar o componente pronto. `MacroSummaryComponent` ganhou
   `orientacao: 'row' | 'col'` (col = anel em cima, chips embaixo, pra caber na coluna estreita de
   296px) e um `<ng-content>` entre o anel e os chips — é onde `storyText()` é projetado, sem a
   frase virar responsabilidade do componente de anel.
   Quinta passada (2026-08-13, mesmo dia): `MacroSummaryComponent` e `StepFooterComponent`
   promovidos pra `components/molecules/` (eram presentation-only, não precisavam esperar uma 2ª
   feature — ver "Estrutura de pastas"); `MetaService`/`RecomendacaoService`/`UserService` saíram
   de `features/*/data/` pra `services/`, um nível só, sem pasta por feature.
   Sexta passada — "navegação em steps ricos" (2026-08-13, mesmo dia): usuário apontou o
   `step-accordion` do collab-creators-ui como referência de boa usabilidade. A 3ª coluna do
   "Painel Vivo" (resumo ao vivo fixo) saiu — o resumo de macro continua existindo dentro do passo
   "Sugestão" e no painel "configurado", só não fica mais grudado do lado do quiz o tempo todo. A
   lista de passos deixou de ser um indicador minimalista (bolinha numerada + texto) e virou uma
   lista de cards — cada item com badge circular grande (ícone Lucide próprio do passo:
   `LucideUser`/`LucideActivity`/`LucideTarget`/`LucideClipboardCheck`, vira `LucideCheck` quando
   concluído), rótulo "Passo N", título, descrição de uma linha, conector fino entre os itens, cor
   de borda/fundo por estado (`group-[.active]:`/`group-[.done]:`, só tokens da paleta — sem
   inventar verde de "sucesso"). Sem agrupamento por categoria (a referência não agrupa, é lista
   plana). Abaixo de `md` (768px) a nav de passos some e um cabeçalho de uma linha ("Passo 2 de 4 ·
   Atividade") aparece no lugar dela — mesma ideia do `step-mobile-header` da referência, versão
   simples. Ver também a entrada sobre o rodapé do quiz não travar mais posição, na seção
   "Decisões de arquitetura" — é a mesma passada, revertendo a "altura fixa + scroll interno" da
   passada anterior depois de constatar que a própria referência não trava o rodapé.
   Sétima passada — "trilha numerada" (2026-08-13, mesmo dia): os "steps ricos" da passada anterior
   viraram 5 conceitos comparados num artefato, cada um baseado num padrão de UX já conhecido
   (trilha com linha estilo GOV.UK/Stripe, stepper Material Design, sidebar de configurações,
   progresso de checkout, checklist de status). Escolhida a trilha com linha — bolinha numerada
   vira check quando concluída, ligada por linha vertical ao próximo passo; sem ícone próprio por
   passo (os `LucideUser`/`LucideActivity`/etc. da passada anterior saíram). A trilha virou
   `StepTrackComponent` (`components/molecules/step-track/`) — presentation-only de verdade (só
   `steps`/`ativo`/`label` de input, `stepClick` de output, nada de Metas) — nasceu direto em
   `components/` porque já foi desenhada pra servir qualquer fluxo multi-passo do produto, não só
   o quiz de Metas (mesmo critério de promoção documentado em "Estrutura de pastas"). Botões
   redondos de voltar/avançar do rodapé (`StepFooterComponent`) diminuíram de 48px pra 38px.
   Oitava passada (2026-08-13, mesmo dia): navegação pela trilha virou livre — clicar em qualquer
   passo pula direto pra ele, não só voltar pra um já concluído (`StepTrackComponent` não desabilita
   mais passo nenhum; a área clicável também cresceu — é o item inteiro, badge + título, não só o
   círculo). O passo em si virar acessível não significa que o dado dele existe: "Sugestão" e
   "Confirmar" dependem de `sugestao()`, calculada só depois do passo "Atividade". `irPara()` em
   `MetasPageComponent` tenta calcular na hora via `calcularSugestaoRecomendacao(currentUser)` se
   o usuário pular direto pra um desses dois sem passar por Atividade antes — funciona se o perfil
   já tem peso/altura/idade/gênero/nível de atividade/objetivo salvos (ex.: de uma sessão anterior);
   se realmente faltar dado, mostra toast de erro e não navega, em vez de deixar o passo abrir em
   branco.
   Nona passada — identidade de "quiz/jogo" (2026-08-13, mesmo dia): depois de comparar 5
   referências de jogo/app (trivia, ficha de RPG, quiz de personalidade, mapa de fases, revelação
   em odômetro) em artefato, escolhida uma combinação: cartões grandes tocáveis nas escolhas
   (Perfil/Atividade) e um momento de revelação estilo RPG na Sugestão e no painel final. Nasceu
   `MetaRevealComponent` (`components/molecules/meta-reveal/`) — anel + dígitos + barras de macro,
   com dois modos: `animar` (nasce "calculando…", dígitos esmaecidos com `animate-pulse`, revela
   sozinho depois de ~900ms — usado no passo Sugestão) e sem `animar` (já nasce revelado — usado no
   painel "configurado", com `label="Build completo"` e um círculo de troféu acima). Reduz motion:
   se `prefers-reduced-motion: reduce`, pula direto pro estado revelado, sem esperar o timeout.
   `MacroSummaryComponent` ficou sem uso (nenhuma tela chama mais) — não foi apagado, é reserva pro
   Dashboard (Fase 6, "meta vs. consumido"), que provavelmente vai querer um anel de macro
   compacto igual a esse.
   `metas-step.scss` (o SCSS compartilhado pelos 4 passos via `styleUrl`) foi apagado — cada passo
   agora define o próprio "casco" de card via `host: { class: 'card flex flex-col gap-5 p-6
md:p-8' }` no `@Component`, e o resto é Tailwind direto no template (consistente com a regra
   "sempre Tailwind", ver Stack). Nova utility global, `animate-reveal` (`src/styles.scss`, mesmo
   padrão do `card`): fade + leve subida pra qualquer conteúdo que apareça depois de um
   cálculo/espera — não é só do quiz de Metas, serve qualquer tela do sistema.
   Perfil ganhou ícones Lucide nos campos e cartões de gênero com ícone (`LucideMars`/
   `LucideVenus`/`LucideUsersRound`) no lugar do `<select>`. Atividade ganhou "pontos de
   intensidade" (bolinhas, 1 a 5 conforme o nível) nos cartões e um chip de prévia de impacto que
   aparece ao escolher o objetivo ("Isso empurra sua meta pra baixo ↓") — não revela número, só
   alimenta curiosidade pro passo seguinte. Confirmar trocou os campos simples por barra estilo
   atributo (preenchimento = valor atual, traço = onde estava a sugestão) por trás de cada input,
   ainda editável. Botão final do rodapé (`StepFooterComponent`, estado `ultimo()`) ganhou um anel
   de destaque (`box-shadow`, mesma linguagem do anel do `MetaRevealComponent`) — não virou botão
   de texto (continua sendo o padrão de ícone redondo já documentado, só com glow a mais).
   Décima passada (2026-08-13, mesmo dia): os cartões de Gênero/Nível de atividade/Objetivo
   ficaram grandes demais esticando pra célula do `grid` — comparados 3 formatos de chip em
   artefato (com ícone, só texto, segmented control) e escolhido "chip com ícone". Viraram
   `inline-flex` num `flex flex-wrap` (largura no conteúdo, não mais `grid` esticado) — cada opção
   só ocupa o espaço do próprio rótulo. Perdeu a descrição longa por baixo do rótulo da Atividade
   (o que mais engordava o cartão antes) — os pontinhos de intensidade dentro do chip já comunicam
   a escala sem precisar de texto extra. Seleção ganhou uma transição com easing de "mola"
   (`cubic-bezier(0.34,1.56,0.64,1)`) + leve `scale-[1.03]` no chip selecionado — pequeno "pop" de
   confirmação, no mesmo espírito de jogo do resto da tela. Os três grupos de chip (e o rótulo
   "Gênero"/"Nível de atividade"/"Objetivo" acima deles) ficaram centralizados — o resto do passo
   já é centralizado (badge, título, subtítulo), os grupos alinhados à esquerda destoavam.
   Décima primeira passada (2026-08-13, mesmo dia): dois ajustes finos. (1) Bug — os campos
   Peso/Altura/Idade (`type="number"`) deixavam digitar letra, `e`/`E` (notação científica) e
   outros símbolos via teclado (o `type="number"` nativo não bloqueia isso sozinho, principalmente
   em Safari/Android/IME). Criada `components/directives/somente-numero.directive.ts`
   (`vtpSomenteNumero`) — bloqueia `keydown`/`paste` fora de dígito/separador decimal/teclas de
   navegação, presentation-only, sem estado — aplicada nos campos numéricos de `perfil-step` (peso,
   altura, idade) e `revisar-step` (meta_calorias/proteinas/carboidratos/gorduras); é o padrão a
   reusar em qualquer campo numérico futuro do sistema. (2) Os 4 passos do quiz (`perfil-step`,
   `atividade-step`, `sugestao-step`, `revisar-step`) ganharam `animate-reveal` (a mesma entrada
   fade+leve-subida já usada em partes do fluxo — ver nona passada) no próprio `host` do card —
   cada passo agora "entra" ao ser exibido, reforçando a identidade de jogo pedida
   ("jogo traz isso") em vez de só o conteúdo interno animar.
4. Alimentos (catálogo) — ✅ feito (2026-08-13), sidebar facetada + alternância Cards/Tabela.
   `AlimentosListComponent` era só busca + abas Todos/Favoritos; ganhou uma sidebar de filtro
   (`grupo` alimentar via checkbox com contagem, faixa de calorias via slider de dois cursores)
   e um toggle Cards/Tabela — direção validada em 3 rodadas de artefato antes de virar código
   (comparação de 5 conceitos de tela inteira, detalhamento sidebar+toggle, layouts de card
   inspirados no `p-dataview`/`p-card` do PrimeNG — na hora, biblioteca não usada, só referência
   de padrão, adaptada aos tokens Horta; virou dependência real na passada seguinte, ver abaixo.
   Facet de Fonte (TACO/Manual) foi cogitado e cortado —
   só Grupo alimentar entrou.
   Máxima componentização, porque Diário (Fase 5) e Dietas (Fase 7) também vão precisar
   escolher/exibir alimentos: `components/molecules/food-tile/` (card denso com anel cônico de
   3 cores proteína/carbo/gordura, fita de favorito só quando `is_favorite`, sem tag de
   fonte/TACO — presentation-only, mesma categoria de `MacroSummaryComponent`),
   `components/molecules/facet-checkbox-list/` e `components/molecules/range-slider/` (ambos
   genéricos, sem noção de "alimento" — reusam `bd-checkbox` da lib; o slider é dois
   `<input type="range">` sobrepostos, porque a bandeira-ui não tem primitivo de range),
   `components/molecules/view-mode-toggle/` (segmentado genérico, não usa `bd-tabs` de
   propósito — aqui é o mesmo dado em duas visões, não painéis de conteúdo diferente). Só a
   composição "Grupo alimentar + faixa de calorias" ficou na feature
   (`features/alimentos/alimentos-filtros/`), por carregar conhecimento de domínio.
   **Limitação real do `bd-table` descoberta implementando**: colunas só aceitam
   `value: (row) => string|number`, sem template por célula — o anel colorido e o favorito
   clicável dos mockups não cabem numa linha de tabela. Resolvido assim: modo Tabela é texto
   puro (descrição/grupo/kcal/macros), `(rowClick)` abre o mesmo painel de detalhe lateral que
   o modo Cards já tinha, onde favoritar continua possível — perda de riqueza visual aceita,
   não um bug a corrigir depois.
   `--fat` (oliva, cor de gordura no mapeamento de macro) era uma custom property local de
   `metas-page.component.scss`, só herdada por quem estava na árvore de DOM de Metas —
   promovida pra `:root`/dark em `src/styles.scss` (mesmos hex) e mapeada em `--color-fat` no
   `@theme`, porque Alimentos não está debaixo de Metas e `var(--fat)` resolveria pra nada ali.
   A fórmula de percentual por macro (kcal de cada macro / kcal total) também saiu do
   `MetaRevealComponent` (estava inline) pra `components/utils/macro-percent.util.ts`,
   compartilhada com `FoodTileComponent` em vez de escrita uma terceira vez.
   Backend (`vitality-Back`): `GET /api/foods/groups` (novo, `FoodController::groups()`) —
   grupos distintos do catálogo ativo com contagem, `{data, success}` sem paginação (poucas
   dezenas de linhas, diferente do `/foods` normal). Precisou entrar **antes** de
   `GET /foods/{food}` em `routes/api.php`, senão o binding implícito do Laravel tenta resolver
   `{food}` com o literal `"groups"`. `FoodController::index` ganhou `grupo` (array,
   `grupo[]=...`) e `caloria_min`/`caloria_max` como filtros adicionais, validados com
   `caloria_max` exigindo `gte:caloria_min` (testado ponta a ponta: filtro combinado retorna
   só o grupo pedido dentro da faixa, e `caloria_max < caloria_min` dá 422 real). `grupo` é
   string livre vinda do CSV do TACO/USDA, sem normalização — o facet reflete a base como está;
   virou item de backlog (não desta rodada) uma coluna `grupo_normalizado`, no mesmo espírito do
   `nome_normalizado` que a busca já usa.
   Segunda passada (mesmo dia): modo Tabela trocou o `bd-table` da bandeira-ui por `p-table` de
   verdade do **PrimeNG**, pedido explícito — a limitação de célula-só-texto descrita acima
   nasceu do `bd-table`, mas a troca não resolveu isso (`p-table` também só projeta template por
   `#header`/`#body`/`#emptymessage` — refs locais, não mais o antigo `pTemplate="..."` — e cada
   `<td>` que a gente escreve é texto puro do mesmo jeito; a diferença real foi ganhar
   `pSortableColumn` nas 6 colunas). **Armadilha real**: `primeng@^20.5.0` é a faixa **LTS paga**
   (banner vermelho de licença inválida em runtime) — a série livre pra Angular 20 para em
   `20.4.0`, por isso a versão no `package.json` está **fixada sem `^`** (`"primeng": "20.4.0"`),
   de propósito, pra um `npm install`/`npm update` não escorregar pra LTS sozinho. Tema veio de
   `@primeuix/themes` direto (não `@primeng/themes`, descontinuado — reexportava daqui mesmo).
   Ordenação é sempre resolvida no backend (`FoodController::index` ganhou `sort_field`
   com whitelist dos 6 campos e `sort_order` asc/desc), nunca no cliente — `p-table` roda em
   `[lazy]="true"` `[lazyLoadOnInit]="false"`, clicar num cabeçalho só emite `(onLazyLoad)` e o
   componente rebusca. `providePrimeNG` **não** entra em `app.config.ts` — o motor de tema
   (`@primeuix/themes`) sozinho estourava o budget de bundle inicial (500kB) em +107kB se
   carregado toda página; vive isolado em `features/alimentos/alimentos.routes.ts` via
   `loadChildren` (não `loadComponent` direto em `app.routes.ts` — declarar o provider ali ainda
   avalia a fábrica no momento em que o array de rotas raiz é montado, que é sempre eager;
   só uma sub-árvore via `loadChildren` isola de verdade). `core/layout/primeng-preset.ts` faz a
   ponte: em vez da paleta verde padrão do Aura, os tokens semânticos (`primary`, `content`,
   `text`, `highlight`) apontam pra `var(--bd-*)` — só o esquema `light` do preset é
   sobrescrito (`darkModeSelector: false`), porque quem decide claro/escuro é `data-theme` no
   `documentElement`, não a classe de dark mode do PrimeNG, e os `--bd-*` já mudam de valor
   sozinhos por causa disso. `styleClass` no `<p-table>` está `@deprecated since v20.0.0` — usar
   `class` normal.
   `AlimentoService.params()` foi reescrito (não só
   estendido) pra serializar array via `.append()` — o `.set(key, String(value))` anterior
   virava `"a,b"` numa query string, que o backend não entende como array.
5. Diário/Registro — ✅ feito (2026-08-14). A rota `/diario` é uma jornada suave, sem ranking ou
   streak: cinco checkpoints pessoais se concluem ao receber lançamento, mas nunca bloqueiam edição.
   O `EntryComposerComponent` preserva a linguagem de quiz em três passos (momento → prato → revisão),
   abre como drawer no desktop e fullscreen no mobile. A topbar usa `/diario?registrar=1` para abrir
   diretamente a escolha de refeição; `daily-checkpoint-track` e `diary-day-summary` ficam em
   `components/molecules/` porque são presentation-only e reutilizáveis.
   Segunda passada — "Jornada do dia: mapa de fases + quiz" (2026-08-14, mesmo dia): a tela original
   virou confusa na prática — cinco entradas diferentes para "registrar" (botão do topo, botão da
   refeição focada, estado vazio, botão flutuante, composer sempre aberto na 3ª coluna), acoplamento
   invisível entre clicar numa refeição e o destino do lançamento, e o modelo de "refeição focada"
   escondia o dia inteiro. Prototipados 10 conceitos de game/quiz em artefatos (missão do dia, ficha
   de personagem, quiz do prato, mapa de fases, baralho de cartas) — escolhida a combinação **mapa de
   fases + quiz do prato**, depois ajustada em 3 rodadas de teste do próprio protótipo até a versão
   final aprovada ("Jornada em dois passos").
   O dia virou um caminho: `JourneyMapComponent` (`components/organisms/journey-map/`) desenha uma
   trilha serpentina em SVG com um disco por refeição (concluída = carimbo verde, atual = balançando
   em `--bd-accent`, aberta = tracejada) e uma bandeira de fim de dia. A curva é paramétrica
   (`journey-path.util.ts`, `trilhaSerpentina(n)`) — o protótipo tinha 5 fases fixas, mas o
   `meal-manager` deixa criar/arquivar refeições, então pra `n === 5` a função devolve os valores
   exatos do protótipo (fidelidade é requisito) e pra outro `n` gera a serpentina algoritmicamente.
   `diario-list` (orquestrador) alterna a coluna direita entre `DiaryPhaseCardComponent` (leitura da
   fase selecionada) e `EntryComposerComponent` (registro) via um `modo: 'cartao' | 'compor'` — nunca
   os dois ao mesmo tempo. No desktop, mapa e cartão ficam lado a lado; abaixo de 900px o mapa é a
   tela inicial e tocar uma fase revela o cartão, que oferece o retorno explícito ao mapa.
   **Composer tem dois passos curtos**: a refeição já foi escolhida no clique do mapa, então vira
   faixa fixa de destino (`DiaryDestinationBandComponent`, "Registrando em X" com "Trocar" atrás de
   um botão) em vez de uma pergunta repetida. Primeiro monta-se o prato e, ao avançar, a revisão
   confirma macros e micronutrientes antes de salvar; voltar preserva o rascunho. A navegação é só o
   par de botões redondos do `StepFooterComponent` — na montagem avançar fica travado com o prato
   vazio, e na revisão vira Salvar sem misturar regra de negócio com o estado `carregando`.
   **Revelação do dia é sob demanda, não só no fim**: clicar na bandeira do mapa abre
   `DayRevealOverlayComponent` a qualquer hora do dia, reusando o `MetaRevealComponent` do quiz de
   Metas (mesmo anel + odômetro + barras de macro). Foi preciso arredondar os totais antes de passar
   — o componente nasceu pra metas inteiras e `digitos()` quebra `1.482,3` em dígitos soltos com um
   float — e adicionar `labelCalculando` (input novo, default preserva Metas) porque o badge "não
   revelado" tinha o texto "Calculando sua meta…" fixo no template.
   **Macros sempre visíveis**: `MacroGoalStripComponent` é uma faixa fixa no topo com kcal + P + C + G
   (consumido/meta), porque o pedido era ver a composição do dia a qualquer momento, não só ao fechar.
   **Alimento é a unidade visual, lançamento é o modelo da API**: `diary-day.util.ts` achata
   `entries[].items[]` em `FaseItem[]` (guardando o `entryId` de origem) pra cada card mostrar
   alimentos soltos, do jeito que a pessoa pensa. Remover um alimento regrava o lançamento sem ele
   (`payloadSemItem`); quando ele era o único item, a operação vira `deleteEntry` (não um PATCH com
   lista vazia, que não é comportamento definido no backend) — só esse caso pede `window.confirm`.
   **Chip de porção (pouco/normal/bastante) nunca é o estado**: `quantity` em gramas é sempre a fonte
   de verdade; o chip só escreve nela. Item vindo do catálogo tem `porcaoBase = Alimento.qtd`; item
   de um lançamento salvo não tem essa referência (a API não devolve o `qtd` do catálogo), e resolver
   isso busca em cascata (memória → `AlimentoService.get(id)`) — se o alimento foi arquivado, a linha
   simplesmente esconde os chips e mostra só o campo em gramas, nunca chuta a base errada.
   **Risco tratado à parte**: o backend recusa consumo no futuro. Como cada fase sugere o próprio
   horário, abrir o jantar de tarde cairia num 422 — a sugestão de horário nunca passa da hora atual
   quando o dia selecionado é hoje.
   `FoodPickCardComponent` (grade de escolha no composer) não reaproveita o `FoodTileComponent` do
   catálogo — este último carrega favoritar/imagem grande, que não cabe numa grade densa de escolha
   rápida — mas os dois passam a compartilhar `calcularProporcaoMacro` (`macro-percent.util.ts`, nova
   função): a fórmula antiga (`calcularPercentuaisMacro`) normaliza pelo campo `caloria` do alimento,
   que no TACO nem sempre bate com 4/4/9 dos macros, deixando buraco numa barra tri-macro contígua.
   `daily-checkpoint-track` e `diary-day-summary` (linha anterior) foram removidos — órfãos depois da
   reescrita, substituídos por `journey-map` e `macro-goal-strip`.
6. Dashboard (meta vs. consumido).
7. Dietas (planos reutilizáveis).
8. Perfil (dados pessoais + avatar) — ✅ feito. É um quiz de 3 etapas: identidade e avatar,
   corpo, rotina e confirmação. Cada avanço persiste seu grupo de dados, reduzindo perda de
   progresso; permite preview, envio, troca e remoção de avatar. Toda resposta sincroniza
   `AuthService.currentUser()` para refletir imediatamente na sidebar/topbar.
   Segunda passada — "crachá de jogador" (2026-08-13): o `ProfilePhotoCardComponent` (avatar +
   texto + botões, todos do mesmo peso visual) foi comparado contra 4 outros conceitos num
   artefato (capa+avatar estilo LinkedIn, hover-reveal estilo Google Conta, dropzone estilo
   Notion, popover estilo Slack) e reconstruído estendendo a linguagem de "jogo/RPG" que o
   `MetaRevealComponent` já usa em Metas — anel com `conic-gradient` + glow em
   `--bd-primary`/`--bd-accent`, badge de câmera em `--bd-accent`, e um selo
   "Perfil X% completo" (`calcularProgressoPerfil`, `components/utils/perfil-progresso.util.ts` —
   9 campos com peso igual, avatar recém-selecionado mas ainda não salvo conta como preenchido).
   O componente ganhou `somenteLeitura` (booleano via `booleanAttribute`) pra reaproveitar o mesmo
   crachá na tela de conclusão do quiz (`perfil-page.component.html`), substituindo o
   ícone-de-check + avatar solto que só existia ali — antes eram duas linguagens visuais pro
   mesmo "perfil pronto", agora é uma. Puxou o `rotina-step` (nível de atividade + objetivo) e os
   chips de gênero do `identidade-step` pro mesmo padrão de chip com pontos de intensidade/ícone/
   easing de mola que o `atividade-step` de Metas já tinha — os dois fluxos editam os mesmos
   campos do `User` (`nivel_atividade`, `objetivo`), então usam agora o mesmo vocabulário visual
   em vez de um grid de cards bordados num lugar e chips pill no outro. `profile-photo-card.
component.scss` foi apagado (Tailwind direto no template, mesmo padrão dos componentes mais
   recentes — ver Stack).
9. Polimento transversal (onboarding, estados vazios, a11y, testes essenciais) — intercalado com as demais.
