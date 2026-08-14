# Biblioteca de ilustrações de alimentos

Cada alimento ativo recebe uma `illustration_key` automática. A chave representa o
ingrediente-base, não a marca, a medida ou o modo de preparo. Assim, variações de
banana usam `banana`, e preparos com cenoura usam `vegetable-carrot`.

## Cobertura atual

- 597 alimentos ativos têm uma chave determinística;
- frutas possuem ilustrações específicas por fruta;
- hortaliças: cenoura, tomate, brócolis, pepino, abóbora e beterraba possuem sprite próprio;
- básicos: arroz, pão, massa, batata, mandioca e aveia possuem sprite próprio;
- os demais grupos usam um fallback semântico (proteína, lácteo, bebida, gordura, doce ou refeição).

## Convenção para novas ilustrações

1. Gerar sprites de seis células (3 × 2), sem texto e com fundo transparente.
2. Criar as classes `.illustration--<chave>` no componente `food-illustration`.
3. Adicionar a chave antes dos fallbacks em `FoodIllustrationResolver`.
4. Executar `php artisan foods:assign-illustrations --dry-run` e revisar a distribuição.
5. Executar `php artisan foods:assign-illustrations` para gravar somente diferenças.
