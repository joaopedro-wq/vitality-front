# Recomendações — Vitality PLUS

Levantamento feito em 2026-08-19 analisando `vitality-front` (Angular 20) e `vitality-Back`
(Laravel) juntos. Lista de problemas encontrados e ações sugeridas para próximas implementações,
priorizadas por risco. Ao resolver um item, mover para "Resolvidos" com a data e o commit/PR,
seguindo o mesmo espírito de registro vivo do `CLAUDE.md`.

## Prioridade alta — segurança

### 1. Ausência de Policy para recursos sensíveis (IDOR real)

**Problema:** o backend só tem 2 Policies no projeto inteiro (`DiaryEntryPolicy`, `MealPolicy`).
Recursos como `Dieta`, `MealPlan`, `MetaDiaria` e `NutricaoRecomendada` não têm checagem de dono —
qualquer usuário autenticado pode, em teoria, ler/editar/apagar recurso de outro usuário só
sabendo o ID (`GET /dieta/{id}`, `PUT /meal-plans/{mealPlan}`, `PUT /meta/{id}`, etc). Isso já
estava anotado como inconsistência conhecida no `CLAUDE.md` para `AlimentoController`/
`DietaController`/`RefeicaoController`, mas o levantamento confirma que a lacuna é mais ampla que
o documentado.

**Ação sugerida:**

- Criar `DietaPolicy`, `MealPlanPolicy`, `MetaDiariaPolicy`, `NutricaoRecomendadaPolicy` seguindo o
  padrão já existente (`DiaryEntryPolicy`).
- Registrar cada Policy e aplicar `$this->authorize(...)` (ou `Gate::authorize`) em `show`,
  `update`, `destroy` de cada controller correspondente.
- Escrever teste de regressão por recurso: usuário B não pode ler/editar/apagar recurso do
  usuário A (403 esperado).

### 2. `EnsureEmailIsVerified` parece código morto (ou verificação sendo pulada)

**Problema:** o middleware existe em `app/Http/Middleware/EnsureEmailIsVerified.php` mas não
aparece registrado em nenhum grupo de rota de `routes/api.php`. Duas hipóteses, nenhuma boa sem
decisão explícita: (a) é código morto que devia ser removido, ou (b) verificação de e-mail está
sendo pulada silenciosamente em produção.

**Ação sugerida:** decidir se verificação de e-mail é requisito de produto. Se for, registrar o
middleware no grupo certo de rotas e cobrir com teste. Se não for, remover o arquivo para não
confundir leitura futura do código.

## Prioridade média — limpeza de contrato de API

### 3. Rotas duplicadas/ambíguas em `routes/api.php`

**Problema:**

- `PUT /atualizar-user/{id}` e `PUT /user/{id}` apontam para o mesmo
  `UserController::update` — dois caminhos para a mesma ação, aparentemente um legado nunca
  removido depois que o segundo foi introduzido.
- `DELETE /registro/{entry}` está declarada duas vezes no arquivo — a segunda ocorrência é morta
  (o Laravel casa a primeira rota que bate), só polui leitura.

**Ação sugerida:**

- Confirmar no frontend (`api-paths.ts`) qual caminho de update de usuário está realmente em uso
  (`atualizar-user` ou `user/{id}`) e remover o outro do backend.
- Remover a segunda declaração de `DELETE /registro/{entry}`.
- Ao mexer nisso, testar ponta a ponta contra o backend real (padrão já estabelecido no projeto
  para mudança de contrato de API).

### 4. Confirmar identificador do modelo Gemini

**Problema:** `.env.example` define `GEMINI_MODEL=gemini-3.6-flash`. Vale confirmar se esse
identificador de modelo é válido e atual — um nome errado no exemplo pode levar a uma configuração
quebrada em ambiente novo, e é justamente o serviço mais complexo do sistema
(`GeminiMealPlanService`, 856 linhas, geração de plano alimentar) que depende inteiramente dele.

**Ação sugerida:** validar o model id contra a documentação/API atual do Gemini e atualizar o
`.env.example` se estiver desatualizado. Documentar no `CLAUDE.md` do backend qual é a fonte de
verdade para esse valor (evitar drift silencioso de novo).

## Prioridade média — cobertura de teste

### 5. Cobertura de teste baixa nos dois lados

**Problema:**

- Frontend: só 4 arquivos `.spec.ts` para ~50+ componentes/features. Praticamente todo o app
  depende de teste manual ponta a ponta contra o backend real.
- Backend: 13 arquivos de teste para 15 controllers + 11 services + a lógica de IA de geração de
  plano alimentar — o componente de maior risco (`GeminiMealPlanService`) provavelmente tem pouco
  ou nenhum teste automatizado dado o volume de código.

**Ação sugerida (nesta ordem, maior risco primeiro):**

1. Teste de contrato para `GeminiMealPlanService` — mockar a resposta da IA e validar
   parsing/regras de negócio (composição de macros, restrições alimentares) sem depender da API
   real do Gemini em CI.
2. Smoke test por feature crítica do frontend: login, diário (registro de lançamento), dietas
   (criar/editar/arquivar). Não precisa ser cobertura completa — só o suficiente para pegar
   regressão de fluxo principal.
3. Teste de regressão de autorização citado no item 1 (IDOR).

## Prioridade baixa — débito técnico conhecido

### 6. Compatibilidade legada acumulando sem critério de saída

**Problema:** `/registro` e `/refeicao` continuam como adaptadores para o contrato novo
(`/diary/*`), já documentado como temporário no `CLAUDE.md`, mas sem data ou critério definido
para remoção.

**Ação sugerida:** definir critério explícito de descontinuação (ex.: nenhum client interno
usando a rota legada + N semanas de aviso) e registrar no `CLAUDE.md` do backend, para não virar
débito permanente por falta de gatilho de remoção.

### 7. Dependência de lib própria não publicada (`bandeira-ui`)

**Problema:** `bandeira-ui` é instalada via tarball local (`vendor/bandeira-ui-*.tgz`), sem
publicação no npm, sem changelog público, sem CI de compatibilidade próprio. Risco de manutenção
de longo prazo — qualquer mudança precisa ser gerada e versionada manualmente.

**Ação sugerida:** sem urgência de ação corretiva agora, mas vale manter registrado como decisão
consciente (já é — ver `CLAUDE.md`, seção Stack) e revisitar se o projeto crescer a ponto de
justificar publicar a lib num registry privado.

---

## Prioridade baixa — débito técnico encontrado implementando o Painel (Fase 6, 2026-08-19)

### 8. `npm run build` e `npm test` já falham no `master`, sem relação com o Painel

**Problema:** confirmado via `git stash -u` (voltando pro `master` limpo) antes de implementar o
Painel — os dois já falhavam independente do meu trabalho:

- `npm run build`: `src/app/components/atoms/food-illustration/food-illustration.component.scss`
  excede o budget de 10KB por só 273 bytes — configurado como `error`, não `warning`, então
  derruba o build de produção inteiro.
- `npm test`: `src/app/components/utils/meal-nutrition.util.spec.ts` tem um objeto de teste
  faltando `detalhe_exibicao`/`descricao_original` do tipo `Alimento` — erro de compilação
  TypeScript, impede a suíte inteira de rodar (não é só aquele spec que falha).

**Ação sugerida:** aparar 273 bytes do SCSS do `food-illustration` (ou subir o budget específico
desse componente em `angular.json`) e completar o objeto de teste em `meal-nutrition.util.spec.ts`
com os dois campos que faltam. Nenhum dos dois exige decisão de produto — é só dívida acumulada
que ninguém notou por rodar sempre em modo dev (`npm start`), que não aplica esses budgets.

### 9. Backend: 4 testes falhando no `master`, também sem relação com o Painel

**Problema:** confirmado da mesma forma (`git stash`, suíte já falhava antes) —
`AuthenticationTest` (login via scaffold Breeze `/login`, rota que este front não usa —
`POST /api/login` é a de verdade), `UserAvatarTest` (espera 422 de validação e recebe 302,
sugere redirect de sessão em vez de erro JSON) e `FoodPlanClassificationServiceTest` (heurística
de classificação de "banana" não bate mais com o esperado).

**Ação sugerida:** decidir se `AuthenticationTest`/rotas do scaffold Breeze ainda fazem sentido no
repo (ver inconsistência já documentada no `CLAUDE.md`: `/logout` real é sessão Breeze, não usada
por este front) — se não, remover o teste em vez de deixá-lo vermelho pra sempre. Os outros dois
(`UserAvatarTest`, `FoodPlanClassificationServiceTest`) parecem regressão real de comportamento;
valem investigação isolada, fora do escopo do Painel.

## Resolvidos

_(vazio até o momento — mover itens para cá conforme forem endereçados, com data e referência do
commit/PR)_
