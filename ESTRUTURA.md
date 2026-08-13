# Estrutura do projeto

Referência de como o código é organizado — onde cada tipo de arquivo mora e por quê. Sempre que a
estrutura mudar (uma pasta nova, um critério de organização revisto), atualize este documento.

## Visão geral

```
src/app/
  core/
    auth/       auth.service.ts, auth.guard.ts, guest.guard.ts, admin.guard.ts, auth.interceptor.ts, token.storage.ts
    http/       error.interceptor.ts, api-paths.ts
    models/     user, alimento, refeicao, dieta, registro, meta-diaria,
                nutricao-recomendada, api-response, nutrientes
    layout/     app-shell/, theme.service.ts, palette.service.ts
  components/
    atoms/       wrappers finos sobre a bandeira-ui — só quando agregam valor
    molecules/   composições pequenas, presentation-only (sem service de feature injetado)
                 macro-summary/  anel + chips de macro (sm/lg/xl) — reserva pro Dashboard
                 meta-reveal/    anel + dígitos + barras de macro em "modo revelação" (calculando
                                 → revelado) — usado no passo Sugestão e no painel "configurado"
                 step-footer/    rodapé padrão de wizard (voltar + botão circular de avançar)
                 step-track/     trilha numerada com linha conectora — nav de qualquer fluxo
                                 multi-passo (usada hoje só no quiz de Metas, pronta pra outros)
                 palette-picker/ seletor presentation-only de paleta (swatch + opção ativa)
                 profile-photo-card/ apresentação reutilizável da foto de perfil
    organisms/   blocos grandes e compostos, presentation-only
                 auth-poster-layout/  chrome visual das telas de auth, herdando a paleta ativa
    directives/  diretivas presentation-only reusáveis (ex.: somente-numero.directive.ts)
    pipes/
    utils/       recomendacao-calc.util.ts (TMB/GET), nutrient-calc.util.ts (fator
                 qtd_pivot/qtd_base, replica o cálculo do backend pra preview client-side)
  services/
    meta.service.ts
    recomendacao.service.ts
    user.service.ts
    (todo service novo que fala com o backend entra aqui)
  features/
    auth/{login,register}/
    dashboard/
    diario/{diario-list,diario-form}/
    alimentos/
      alimentos-list/             Biblioteca global: busca, TACO e favoritos pessoais
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
