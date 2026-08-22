# Recomendações — Vitality PLUS

Revisão realizada em 2026-08-22 nos repositórios `vitality-front` (Angular 20) e
`vitality-Back` (Laravel). Itens ordenados por risco e impacto. Este arquivo deve
ser tratado como registro vivo: ao concluir um item, movê-lo para **Resolvidos**
com data e referência do commit/PR.

## Prioridade crítica — segurança e controle de acesso

### 1. Corrigir IDOR em usuários, dietas, metas e recomendações nutricionais

**Evidência:** as rotas autenticadas `GET /users`, `GET /user/{id}` e
`PUT /user/{id}` permitem consultar/alterar usuários sem verificar que o recurso
pertence ao solicitante. O mesmo padrão existe em `DietaController`,
`MetaDiariaController` e `NutricaoRecomendadaController`: usam `find($id)` em
`show`, `update` e `destroy`, sem escopo por `id_usuario` nem Policy. Um token
válido pode ler ou alterar dados de outro usuário ao trocar o ID na URL.

**Ação sugerida:**

- Remover `GET /users`, `POST /user` e `GET /user/{id}` da API comum, ou protegê-los
  por middleware/policy de administrador; o app deve usar apenas o usuário da sessão.
- Criar Policies (ou consultas sempre escopadas pelo usuário autenticado) para
  `Dieta`, `Meta_diaria` e `NutricaoRecomendada`; aplicar em leitura, edição e exclusão.
- Eliminar a rota duplicada `PUT /atualizar-user/{id}` e fazer atualização de perfil
  operar sobre `request()->user()`.
- Criar testes de autorização: usuário B recebe 404/403 ao tentar ver, editar ou
  excluir recursos do usuário A.

### 2. Implementar logout real e revogação de token Sanctum

**Evidência:** o front chama `POST {apiUrl}/logout` (rota web do Breeze, baseada em
sessão), enquanto a autenticação usada pelo app é Bearer/Sanctum em
`POST /api/login`. Não há `POST /api/logout` autenticado. Assim, o logout local
remove o token do navegador, mas não o invalida no servidor; um token copiado ou
comprometido continua utilizável.

**Ação sugerida:** criar `POST /api/logout` sob `auth:sanctum` que revogue somente
o token atual (`$request->user()->currentAccessToken()->delete()`), apontar
`authPaths.logout()` para ele e testar login → logout → acesso protegido (401).
Definir também expiração/rotação de tokens em produção.

### 3. Proteger login e cadastro contra abuso e enumeração de contas

**Evidência:** `AuthController::login` retorna 404 para e-mail inexistente e 401
para senha incorreta, revelando quais e-mails possuem conta. A rota `/api/login`
não tem validação de formato nem rate limiting; o limite existente no request do
Breeze não é usado por essa rota. `storeUser` aceita senha sem tamanho mínimo.

**Ação sugerida:** responder sempre com 401 e uma mensagem genérica para credenciais
inválidas; validar `email` e `password`; aplicar `throttle` ao login e ao cadastro;
exigir senha forte (por exemplo, `Password::min(12)->mixedCase()->numbers()`).
Adicionar testes para bloqueio temporário e para resposta indistinguível.

### 4. Reduzir exposição do token no navegador

**Evidência:** `TokenStorage` persiste o Bearer token em `localStorage`. Qualquer
XSS bem-sucedido consegue exfiltrá-lo; a página não declara uma Content Security
Policy visível no `index.html`.

**Ação sugerida:** preferir cookie `HttpOnly`, `Secure`, `SameSite` com fluxo Sanctum
stateful e proteção CSRF. Se a migração não puder ser imediata, estabelecer CSP
restritiva no servidor, revisar dependências/renderizações e manter tokens de curta
duração com revogação funcional (item 2).

## Prioridade alta — qualidade de entrega e confiabilidade

### 6. Tornar a suíte de testes do back-end executável de forma isolada

**Evidência:** `php artisan test` executado em 2026-08-22 resultou em 38 falhas e
2 sucessos. Trinta e seis testes de feature nem chegaram a rodar: `tests/TestCase.php`
interrompe quando encontra `bootstrap/cache/config.php`. A suíte depende de estado
local de cache e não é reproduzível. Permanecem ainda duas falhas reais no teste
unitário `FoodPlanClassificationServiceTest`, cujas expectativas não acompanham
as tags retornadas pelo classificador.

**Ação sugerida:** criar um comando de CI/teste que garanta ambiente isolado
(`APP_ENV=testing`, banco de testes e caches limpos) sem exigir intervenção manual;
não versionar cache de configuração. Em seguida, decidir e alinhar contrato versus
expectativas do classificador, restaurando a suíte verde antes de novas features.

### 7. Cobrir fluxos críticos com testes de contrato e autorização

**Evidência:** o front possui somente quatro arquivos `*.spec.ts`; há ampla lógica
de formulário, autenticação, diário e geração de planos sem cobertura automatizada.
No back-end, a geração por IA concentra regras de negócio e integrações externas.

**Ação sugerida (ordem):**

1. Testes de autorização do item 1 e de logout do item 2.
2. Testes de API para login, diário e criação/edição/arquivamento de plano.
3. Testes de contrato para `GeminiMealPlanService`, simulando respostas da IA e
   validando macros, alimentos incluídos/excluídos e expiração de rascunho.
4. Smoke tests do front para login, lançamento no diário e plano manual.

## Prioridade média — contrato, arquitetura e operação

### 8. Consolidar contratos de autenticação e rotas legadas

**Evidência:** coexistem o fluxo web do Breeze (`/login`, `/logout`, `/register`)
e o fluxo API próprio (`/api/login`, `/api/criar-usuario`). O front contém paths
para ambos, embora use apenas parte deles. Também seguem expostos os adaptadores
legados `/registro` e `/refeicao`, paralelos a `/diary/*`.

**Ação sugerida:** definir Sanctum API ou sessão/cookie como estratégia única;
remover endpoints e paths não utilizados; documentar proprietário, consumidores e
data/critério de remoção das rotas legadas. Cobrir mudanças de contrato em testes
de integração front-back.

### 9. Decidir explicitamente sobre verificação de e-mail

**Evidência:** `EnsureEmailIsVerified` é registrado como alias `verified`, mas
nenhuma rota de `api.php` o usa. Há rotas web de verificação do Breeze, porém o
fluxo API de cadastro não evidencia envio ou exigência de verificação.

**Ação sugerida:** se e-mail verificado for requisito, implementar o fluxo no
cadastro API e aplicar o middleware às rotas adequadas; se não for, remover o
middleware/rotas não utilizados para evitar falsa sensação de proteção.

### 10. Validar configuração de produção e serviço Gemini

**Evidência:** o `environment.ts` de produção aponta para
`https://api.vitalityplus.example.com`, que parece placeholder, e `.env.example`
do backend declara `GEMINI_MODEL=gemini-3.6-flash`. Ambos precisam de validação
antes de um deploy novo.

**Ação sugerida:** separar configuração real por pipeline/secret manager, validar
URL de API, CORS e domínios Sanctum em staging; confirmar o identificador Gemini
contra a API/documentação em uso e executar um smoke test sem expor a chave.

## Prioridade baixa — manutenção

### 11. Formalizar manutenção de `bandeira-ui`

**Evidência:** a dependência é instalada de um tarball local
(`vendor/bandeira-ui-0.2.0.tgz`), sem versão publicada/CI de compatibilidade
visível.

**Ação sugerida:** manter changelog e versionamento do artefato; se a reutilização
crescer, publicar em registry privado e adicionar teste de compatibilidade com o
Angular suportado.

### 12. Corrigir a configuração PHP que tenta carregar `pdo_firebird`

**Evidência:** todo `php artisan test` emite aviso de que a extensão dinâmica
`pdo_firebird` não foi encontrada. Não bloqueou a execução nesta revisão, mas polui
logs, pode ocultar avisos importantes e torna o ambiente menos reproduzível.

**Ação sugerida:** remover a extensão do `php.ini` usado pelo projeto se Firebird
não for dependência, ou instalar a DLL compatível e documentar o requisito.

## Resolvidos

- 2026-08-22 — o objeto de teste de `meal-nutrition.util.spec.ts` já contém os
  campos de apresentação que anteriormente causavam erro de tipagem.
- 2026-08-22 — build de produção desbloqueado: o CSS de `food-illustration` foi
  reduzido sem alterar sprites ou classes, mantendo o budget de 10 kB; o workflow
  GitHub Actions passou a executar `npm ci && npm run build` em pushes e pull requests.
