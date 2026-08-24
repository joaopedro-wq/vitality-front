# Recomendações e próximas demandas

Backlog de demandas do `vitality-front` (Angular 20) e do `vitality-Back` (Laravel 11), revisado em 2026-08-23.

## Features

### Recuperação de senha pelo front-end

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Implementar no front-end o fluxo completo de recuperação e redefinição de senha usando os endpoints já disponíveis no back-end. O usuário deve solicitar o link, acessar a tela de nova senha e receber confirmações claras em cada etapa.
- **Critérios de aceite:**
  - Usuário pode solicitar a recuperação informando o e-mail;
  - Link válido direciona para uma tela de redefinição de senha;
  - Nova senha segue a política atual de validação;
  - Mensagens de sucesso e erro respeitam o idioma ativo;
  - O fluxo não expõe se um e-mail possui ou não conta cadastrada.

### Notificações e lembretes de refeições

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Permitir que o usuário configure lembretes para registrar refeições em horários definidos, com opção de ativar, editar ou desativar cada lembrete.
- **Critérios de aceite:**
  - Usuário pode criar, editar e remover lembretes por horário;
  - Lembretes respeitam as permissões de notificação do dispositivo;
  - Usuário consegue desativar todos os lembretes a qualquer momento;
  - O comportamento funciona em desktop e mobile dentro das capacidades da plataforma.

### Metas semanais e acompanhamento de progresso

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Complementar a meta diária com uma visão semanal de consistência, exibindo dias com meta atingida, progresso acumulado e evolução no período.
- **Critérios de aceite:**
  - Usuário visualiza o progresso da semana atual;
  - Dias com e sem meta atingida são identificados claramente;
  - Indicadores semanais são calculados a partir dos registros existentes;
  - A interface funciona em desktop e mobile.

### Histórico e comparativo de planos alimentares

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Permitir consultar planos alimentares anteriores, comparar informações relevantes entre versões e reutilizar um plano existente como base para um novo planejamento.
- **Critérios de aceite:**
  - Usuário acessa o histórico de planos próprios;
  - É possível comparar informações essenciais entre dois planos;
  - Um plano anterior pode ser duplicado como base para edição;
  - Nenhuma alteração é aplicada ao plano original sem confirmação.

### Refeições salvas e favoritas

- **Status:** Pendente
- **Prioridade:** Alta
- **Descrição:** Permitir salvar combinações de alimentos ou refeições frequentes para lançamento rápido no Diário.
- **Critérios de aceite:**
  - Usuário pode salvar, editar e remover refeições favoritas;
  - Refeições salvas podem ser adicionadas ao Diário com poucos passos;
  - Quantidades e alimentos da refeição são preservados no lançamento;
  - Dados são isolados por usuário.

### Relatório de evolução por período

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Criar uma visão de evolução com consumo médio, adesão às metas e principais indicadores nutricionais em um período selecionado, com opção de exportação simples.
- **Critérios de aceite:**
  - Usuário seleciona o período do relatório;
  - Relatório exibe métricas e evolução calculadas a partir dos registros;
  - Dados sem registros suficientes são tratados com estado vazio claro;
  - Relatório pode ser exportado em formato definido pelo produto.

### Compartilhamento de acompanhamento com nutricionista

- **Status:** Pendente
- **Prioridade:** Baixa
- **Descrição:** Permitir gerar um link ou relatório controlado para compartilhar diário, metas e planos alimentares com um nutricionista ou profissional autorizado.
- **Critérios de aceite:**
  - Usuário escolhe quais informações compartilhar;
  - Compartilhamento possui prazo de validade e pode ser revogado;
  - Dados compartilhados ficam indisponíveis após revogação ou expiração;
  - Acesso compartilhado não permite alteração dos dados do usuário.

### Central de notificações internas

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Criar uma central de avisos dentro da aplicação para informar plano vencido, meta não definida, lembretes e atualizações relevantes.
- **Critérios de aceite:**
  - Usuário visualiza notificações não lidas e histórico recente;
  - Notificações podem ser marcadas como lidas;
  - Cada aviso direciona para a ação ou tela relacionada quando aplicável;
  - Usuário não recebe notificações de outros usuários.

### Política de verificação de e-mail

- **Status:** Pendente
- **Prioridade:** Média
- **Descrição:** Definir se a verificação de e-mail será requisito da aplicação. Caso seja, implementar envio e confirmação antes do acesso a rotas sensíveis; caso não seja, remover aliases e rotas sem uso que possam sugerir uma proteção inexistente.
- **Critérios de aceite:**
  - A política de verificação de e-mail está definida e documentada;
  - Se adotada, a confirmação é exigida nas rotas sensíveis definidas;
  - Se não adotada, aliases e rotas não utilizados são removidos.

## Bugs / Fixes

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
