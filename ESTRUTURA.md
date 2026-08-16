# Estrutura do projeto

Referência de como o código é organizado — onde cada tipo de arquivo mora e por quê. Sempre que a
estrutura mudar (uma pasta nova, um critério de organização revisto), atualize este documento.

## Visão geral

```
src/app/
  core/
    auth/       auth.service.ts, auth.guard.ts, guest.guard.ts, admin.guard.ts, auth.interceptor.ts, token.storage.ts
    http/       error.interceptor.ts, api-paths.ts
    models/     user, alimento, refeicao, dieta, registro, diary, meta-diaria,
                nutricao-recomendada, api-response, nutrientes
    layout/     app-shell/, theme.service.ts, palette.service.ts, navegacao.service.ts
                (navegacao.service.ts: signal `navegando` a partir de router.events, pro
                 indicador de troca de rota — trata Cancel/Error, não só Start/End)
  components/
    atoms/       wrappers finos sobre a bandeira-ui e primitivos visuais próprios
                 plate-loader/   "Prato Servindo" — o único indicador de espera do sistema,
                                 em 4 escalas (xs/sm/md/lg); `cor="herdada"` quando estiver
                                 sobre superfície primary
    molecules/   composições pequenas, presentation-only (sem service de feature injetado)
                 page-title/     contexto + título + subtítulo dos cabeçalhos de tela; mantém
                                 tipografia e espaçamentos centralizados, com variante de auth
                 loading-state/  prato + título + descrição — bloco de espera de tela/seção,
                                 único dono de `role="status"` do sistema
                 macro-summary/  anel + chips de macro (sm/lg/xl) — Metas, Diário e Dashboard
                 meta-reveal/    anel + dígitos + barras de macro em "modo revelação" (calculando
                                 → revelado) — usado no passo Sugestão, no painel "configurado" de
                                 Metas e no `day-reveal-overlay` do Diário
                 nutrition-reveal/ composição reutilizável da revelação (macros e, opcionalmente,
                                  micronutrientes) — bandeira do Diário e revisão da refeição
                 step-footer/    rodapé padrão de wizard (voltar + botão circular de avançar);
                                 `desabilitado` trava o avançar por regra de negócio (ex.: prato
                                 vazio no Diário), separado de `carregando`
                 step-track/     trilha numerada com linha conectora — nav de qualquer fluxo
                                 multi-passo (usada hoje só no quiz de Metas, pronta pra outros)
                 palette-picker/ seletor presentation-only de paleta (swatch + opção ativa)
                 profile-photo-card/ apresentação reutilizável da foto de perfil
                 macro-goal-strip/ faixa fina de kcal/P/C/G do dia (consumido/meta) — Diário
                 diary-phase-card/ cartão de leitura de uma fase (refeição) do Diário — itens
                                 achatados, macros, e a ação de registro daquela fase
                 diary-destination-band/ faixa "Registrando em X" do composer do Diário, com
                                 troca de destino opcional atrás de um botão
                 plate-row/      linha de um alimento no prato sendo montado — chips de porção
                                 (pouco/normal/bastante) só quando a porção de referência do
                                 catálogo é conhecida; gramas livre é sempre a fonte de verdade
                 food-pick-card/ card denso de escolha rápida de alimento (grade do composer),
                                 com barra tri-macro — não confundir com food-tile (catálogo)
    organisms/   blocos grandes e compostos, presentation-only
                 auth-poster-layout/  chrome visual das telas de auth, herdando a paleta ativa
                 journey-map/    mapa de fases do Diário — trilha serpentina SVG (`journey-
                                 path.util.ts` gera a curva pra N fases), discos com estados
                                 concluída/atual/selecionada, carimbo ao registrar, bandeira de
                                 fim de dia
                 day-reveal-overlay/ overlay de revelação do dia (aberto pela bandeira do mapa),
                                 reusa `meta-reveal` arredondando os totais antes de passar
                 loading-overlay/ scrim + `loading-state` para ação longa que trava a tela
                                 (gerar plano de dieta, reimportar TACO)
    directives/  diretivas presentation-only reusáveis (ex.: somente-numero.directive.ts)
    pipes/
    utils/       recomendacao-calc.util.ts (TMB/GET), meal-nutrition.util.ts (soma o detalhe
                 nutricional do catálogo proporcionalmente ao rascunho da refeição)
                 diary-day.util.ts (achata entries[].items[] em fases/itens do Diário, payload de
                 remoção de item, heurística de momento da refeição)
                 journey-path.util.ts (curva serpentina do mapa de fases, paramétrica em N)
                 macro-percent.util.ts (calcularPercentuaisMacro por caloria total,
                 calcularProporcaoMacro por soma dos macros — pra barras contíguas sem buraco)
                 loading-gate.util.ts (gateCarregamento: signal de carregamento cru -> signal
                 de exibição, com atraso de 250ms e permanência mínima de 400ms; tem .spec.ts)
  services/
    meta.service.ts
    recomendacao.service.ts
    user.service.ts
    (todo service novo que fala com o backend entra aqui)
  features/
    auth/{login,register}/
    dashboard/
    diario/
      diario-list/      orquestrador da "Jornada do dia" — mapa de fases + faixa de macros;
                        alterna a coluna direita entre `diary-phase-card` (leitura) e
                        `entry-composer` (registro), nunca os dois ao mesmo tempo; no mobile o
                        mapa é a visão inicial e a fase abre sob demanda
      entry-composer/   registro em dois passos (montagem e revisão) — a fase já vem decidida
                        do mapa; navegação só pelos botões do `step-footer`
      meal-manager/     organizar nomes, horários e arquivamento das refeições
    alimentos/
      alimentos-list/             Biblioteca global: busca, fontes TACO/USDA e favoritos pessoais
      admin-foods/                gestão de catálogo protegida por adminGuard
    dietas/{dietas-list,dieta-form}/
    metas/
      metas-page/
        metas-page.component.*     orquestrador — fase/passo/sugestão, navegação (markup próprio)
        steps/
          perfil-step/             passo 1 — lógica e form próprios, injeta UserService direto
          atividade-step/          passo 2 — idem, calcula a sugestão a partir da própria resposta
          sugestao-step/           passo 3 — só apresentação, sem serviço
          revisar-step/            passo 4 — form + salva recomendação/meta, emite ao concluir
    recomendacao/    (sem página própria — a UI virou o passo "Sugestão" do quiz)
    perfil/perfil-page/
      perfil-page.component.*      orquestrador do quiz de perfil (passo e confirmação)
      steps/
        identidade-step/           nome, e-mail, nascimento, gênero e avatar
        corpo-step/                peso e altura
        rotina-step/               atividade, objetivo e resumo final
    ui-check/    smoke test visual da Fase 0 — remover quando o dashboard real existir
  app.routes.ts
  app.config.ts
```

## Princípio geral

Pastas por **feature** (área do produto) para tudo específico de uma tela; hierarquia **atômica**
dentro de `components/` para tudo reutilizável; `services/` centraliza todo service que chama a
API do backend, fora das features.

## Regra pra componente — nasce em `components/` ou na feature?

Decide pela **natureza** do componente, não por quantas features já usam — não espera uma segunda
feature aparecer:

- **Presentation-only** (só `input()`/`output()`, sem injetar service de uma feature específica)
  nasce direto em `components/atoms|molecules|organisms`, mesmo que só uma feature use hoje. É o
  caso de `MacroSummaryComponent` e `StepFooterComponent`, que nasceram dentro de `features/metas`
  e foram promovidos assim que ficou claro que eram só apresentação.
- **Componente com lógica/service da própria feature** (os 4 `*-step` do quiz de Metas, por
  exemplo) fica na feature — não tem o que promover, ele _é_ daquela feature.
- Dentro de cada feature, componentes de uso único ficam soltos na própria pasta, sem
  sub-hierarquia atômica interna.

## Regra pra service

Todo service que chama a API do backend (`HttpClient`) entra em `services/<nome>.service.ts`,
plano, sem pasta por feature.

**Exceção**: `core/auth/auth.service.ts`, `core/layout/theme.service.ts` e
`core/layout/palette.service.ts` continuam em `core/`, por serem infraestrutura acoplada a
guards/interceptors/boot da aplicação, não service de feature.

## Onde entra código novo

| Tipo de código                                    | Onde mora                                 |
| ------------------------------------------------- | ----------------------------------------- |
| Tela/fluxo de uma área do produto                 | `features/<area>/`                        |
| Componente reutilizável, sem service de feature   | `components/atoms\|molecules\|organisms/` |
| Diretiva reutilizável, sem estado                 | `components/directives/`                  |
| Pipe reutilizável                                 | `components/pipes/`                       |
| Função utilitária pura (cálculo, formatação)      | `components/utils/`                       |
| Service que chama o backend                       | `services/`                               |
| Guard, interceptor, model, infraestrutura de boot | `core/`                                   |
