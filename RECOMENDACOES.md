# Recomendações e próximas demandas

Backlog de demandas do `vitality-front` (Angular 20) e do `vitality-Back` (Laravel 11), revisado em 2026-08-23.

## Features

### Logout automático por inatividade

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Encerrar a sessão após 30 minutos sem interação relevante do usuário. Considerar clique, toque, navegação e digitação como atividades que reiniciam a contagem. Antes do encerramento, avaliar um aviso que permita confirmar a atividade e manter a sessão. Considerar também o comportamento em múltiplas abas.
- **Critérios de aceite:**
  - Usuário é desconectado após 30 minutos de inatividade;
  - Interações relevantes reiniciam a contagem;
  - Tokens e dados de sessão são limpos corretamente;
  - Usuário é redirecionado para o login;
  - Não ocorre logout durante uso ativo;
  - Funciona em desktop e mobile;
  - O comportamento é coberto por testes E2E.

### Política de verificação de e-mail

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Definir se a verificação de e-mail será requisito da aplicação. Caso seja, implementar envio e confirmação antes do acesso a rotas sensíveis; caso não seja, remover aliases e rotas sem uso que possam sugerir uma proteção inexistente.
- **Critérios de aceite:**
  - A política de verificação de e-mail está definida e documentada;
  - Se adotada, a confirmação é exigida nas rotas sensíveis definidas;
  - Se não adotada, aliases e rotas não utilizados são removidos.

## Bugs / Fixes

### Regra de senha e tradução das validações

- **Status:** Pendente
- **Prioridade:** Alta
- **Problema:** Cadastro e login exigem senha com mínimo de 12 caracteres, e as mensagens de validação de senha são retornadas em inglês.
- **Comportamento esperado:** A validação do back-end deve aceitar senhas com 6 ou mais caracteres e retornar as mensagens no idioma ativo da sessão, sem alterar outras regras de autenticação sem necessidade.
- **Critérios de aceite:**
  - Senha com 6 ou mais caracteres é aceita;
  - Senha com menos de 6 caracteres exibe mensagem clara;
  - A mensagem respeita o idioma atual da sessão;
  - Outras regras de autenticação não são alteradas sem necessidade.

### Corrigir a configuração PHP de `pdo_firebird`

- **Status:** Pendente
- **Prioridade:** Baixa
- **Problema:** A extensão `pdo_firebird` configurada no `php.ini` gera avisos durante a execução de comandos Artisan.
- **Comportamento esperado:** O ambiente PHP deve carregar apenas extensões disponíveis e necessárias ao projeto.
- **Critérios de aceite:**
  - A extensão é removida do `php.ini` se Firebird não for dependência, ou a DLL compatível é instalada;
  - Comandos Artisan deixam de exibir o aviso relacionado ao `pdo_firebird`.

## Melhorias / Ajustes

### Validar e endurecer a sessão Sanctum em produção

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Confirmar em staging e produção a configuração de CORS, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, `Secure`, `HttpOnly` e `SameSite` para os domínios reais do front-end. Adicionar uma Content Security Policy restritiva e revisar o fluxo de CSRF após alterações de domínio ou proxy reverso.
- **Critérios de aceite:**
  - Login, renovação e logout funcionam entre os domínios reais;
  - Cookies não são enviados por HTTP ou para origens não autorizadas;
  - A CSP não bloqueia recursos legítimos e reduz a superfície de XSS.

### Restaurar uma suíte de testes de backend isolada e verde

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Eliminar dependências de cache ou configuração local que interrompem `php artisan test`, assegurar banco de testes isolado e alinhar os testes do classificador de planos ao contrato atual.
- **Critérios de aceite:**
  - `php artisan test` executa do zero em CI, sem cache prévio ou banco local;
  - A suíte finaliza sem falhas.

### Cobrir autorização, rate limit e sessão com testes de feature

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Criar testes Laravel que comprovem o isolamento de recursos entre usuários, o limite de tentativas de login e cadastro, a resposta genérica para credenciais inválidas e o fluxo login → logout → acesso protegido (`401`).
- **Critérios de aceite:**
  - Cenários de acesso entre usuários são cobertos na suíte;
  - Abuso de autenticação e encerramento de sessão são validados;
  - Os testes passam a fazer parte da suíte obrigatória de CI.

### Adotar testes E2E do front com Playwright

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Adicionar Playwright ao front-end, scripts de execução local e em CI, além de uma aplicação de teste com API controlada ou ambiente dedicado. Cobrir login, troca instantânea de idioma, mostrar e ocultar senha, logout, proteção de rota, criação de lançamento no diário e fluxo de plano manual.
- **Critérios de aceite:**
  - `npm run test:e2e` executa de forma reproduzível em CI;
  - O fluxo cobre os cenários definidos;
  - Relatório, screenshots e trace são gerados em caso de falha.

### Reduzir o bundle inicial do Angular

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Investigar dependências carregadas no bootstrap, dividir recursos não críticos e acompanhar o orçamento de bundle no CI. O bundle inicial atual excede o aviso de 620 kB.
- **Critérios de aceite:**
  - O bundle inicial fica dentro do budget acordado;
  - Não há regressão no carregamento das rotas lazy;
  - O orçamento é acompanhado no CI.

### Consolidar rotas e contratos legados

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Mapear e remover endpoints e paths não consumidos, documentar o contrato público da API e definir uma data de remoção para os adaptadores legados restantes.
- **Critérios de aceite:**
  - Endpoints e paths não utilizados são identificados;
  - O contrato público da API está documentado;
  - Adaptadores legados restantes possuem prazo de remoção definido.

### Validar configurações de deploy e Gemini

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Substituir placeholders por configuração via secrets e pipeline, testar CORS e API em staging e confirmar que o modelo Gemini configurado corresponde à conta e à API efetivamente utilizadas.
- **Critérios de aceite:**
  - Placeholders são removidos em favor de secrets ou pipeline;
  - CORS e API são validados em staging;
  - A configuração do Gemini é confirmada com a conta e API em uso.

### Formalizar a manutenção do `bandeira-ui`

- **Status:** Pendente
- **Prioridade:** Baixa
- **Descrição:** Versionar e publicar o artefato em um registry apropriado, mantendo changelog e testes de compatibilidade com as versões suportadas do Angular.
- **Critérios de aceite:**
  - O pacote possui versionamento e publicação definidos;
  - Um changelog é mantido;
  - Há teste de compatibilidade com as versões suportadas do Angular.
