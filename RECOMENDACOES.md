# Recomendações — Vitality PLUS

Backlog técnico revisado em 2026-08-22 para `vitality-front` (Angular 20) e
`vitality-Back` (Laravel 11). Este documento contém somente trabalho futuro;
entregas concluídas devem ser registradas no histórico do commit/PR correspondente.

## Prioridade crítica — segurança e confiabilidade

### 1. Validar e endurecer a sessão Sanctum em produção

Confirmar em staging e produção a combinação de CORS, `SANCTUM_STATEFUL_DOMAINS`,
`SESSION_DOMAIN`, `Secure`, `HttpOnly` e `SameSite` para o domínio real do front.
Adicionar uma Content Security Policy restritiva no servidor e revisar o fluxo de
CSRF após cada alteração de domínio ou proxy reverso.

**Critério de aceite:** login, renovação e logout funcionam entre os domínios reais;
cookies não são enviados por HTTP nem para origens não autorizadas; CSP não bloqueia
recursos legítimos e reduz superfícies de XSS.

### 2. Restaurar uma suíte de testes de backend isolada e verde

Eliminar a dependência de cache/configuração local que interrompe `php artisan test`,
assegurar banco de testes isolado e alinhar os testes do classificador de planos ao
contrato atual.

**Critério de aceite:** `php artisan test` roda do zero em CI, sem cache prévio ou
banco local, e finaliza sem falhas.

### 3. Cobrir autorização, rate limit e sessão com testes de feature

Criar testes Laravel para provar que um usuário não lê, edita ou exclui recursos de
outro; validar limite de login/cadastro, resposta genérica de credenciais e fluxo
login → logout → acesso protegido (`401`).

**Critério de aceite:** os cenários A × B, abuso de autenticação e encerramento de
sessão fazem parte da suíte obrigatória de CI.

## Prioridade alta — qualidade de entrega

### 4. Adotar testes E2E do front com Playwright

Adicionar Playwright ao frontend, scripts de execução local/CI e uma aplicação de
teste com API controlada (ou ambiente dedicado). Cobrir login, troca instantânea de
idioma, mostrar/ocultar senha, logout, proteção de rota, criação de lançamento no
diário e fluxo de plano manual.

**Critério de aceite:** `npm run test:e2e` executa de forma reproduzível em CI e
gera relatório, screenshots e trace quando houver falha.

### 5. Concluir a expiração por inatividade

Integrar o serviço de inatividade ao ciclo de autenticação, avisar o usuário antes
do encerramento e renovar a sessão quando ele continuar ativo. Definir o tratamento
em múltiplas abas e cobrir o comportamento nos testes E2E.

**Critério de aceite:** após o limite configurado a sessão é encerrada de forma
visível e segura; a atividade válida a mantém ativa sem reiniciar o estado da tela.

### 6. Reduzir o bundle inicial do Angular

O build já é gerado, porém o bundle inicial excede o aviso de 620 kB. Investigar
dependências carregadas no bootstrap, dividir recursos não críticos e acompanhar o
orçamento no CI.

**Critério de aceite:** bundle inicial dentro do budget acordado, sem regressão de
carregamento das rotas lazy.

## Prioridade média — contrato e operação

### 7. Consolidar rotas e contratos legados

Mapear e remover endpoints/paths não consumidos, documentar o contrato público da
API e definir uma data de remoção para os adaptadores legados restantes.

### 8. Decidir e implementar a política de verificação de e-mail

Definir se verificação é requisito. Se for, enviar e exigir confirmação antes de
rotas sensíveis; se não for, remover aliases e rotas sem uso para evitar falsa
sensação de proteção.

### 9. Validar configurações de deploy e Gemini

Substituir placeholders por configuração via secrets/pipeline, testar CORS e API em
staging e confirmar o modelo Gemini configurado com a conta e API efetivamente usadas.

## Prioridade baixa — manutenção

### 10. Formalizar manutenção do `bandeira-ui`

Versionar e publicar o artefato em registry apropriado, com changelog e teste de
compatibilidade com as versões suportadas do Angular.

### 11. Corrigir a configuração PHP de `pdo_firebird`

Remover a extensão do `php.ini` se Firebird não for dependência ou instalar a DLL
compatível, eliminando o aviso que hoje polui os comandos Artisan.
