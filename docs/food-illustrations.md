# Biblioteca de ilustrações de alimentos

Cada alimento ativo recebe uma `illustration_key` automática. A chave representa o
ingrediente-base, não a marca, a medida ou o modo de preparo. Assim, variações de
banana usam `banana`, e preparos com cenoura usam `vegetable-carrot`.

## Cobertura atual

- 597 alimentos ativos têm uma chave determinística;
- frutas possuem ilustrações específicas por fruta;
- hortaliças: cenoura, tomate, brócolis, pepino, abóbora e beterraba possuem sprite próprio;
- básicos: arroz, pão, massa, batata, mandioca e aveia possuem sprite próprio;
- ovos: ovo cru, frito, cozido, omelete, codorna e cartela possuem sprite próprio;
- miscelâneas: café, capuccino, fermentos, gelatina e sal possuem sprite próprio;
- outros industrializados: azeitonas, chantilly, leite de coco, maionese e conserva possuem sprite próprio;
- produtos açucarados: chocolate, açúcar, cocada, doce de abóbora, doce de leite e rapadura possuem sprite próprio;
- verduras e hortaliças: alface, couve, repolho, berinjela, pimentão e espinafre possuem sprite próprio, além dos vegetais já cobertos;
- alimentos preparados: salada, sopa, ensopado, yakisoba, acarajé e vatapá possuem sprite próprio;
- derivados de carne: hambúrguer, linguiça, presunto, salame, quibe e almôndega possuem sprite próprio;
- derivados de cereais: farinha, milho, biscoito, bolo, cereal matinal e pipoca possuem sprite próprio;
- preparos brasileiros: cuscuz, feijoada, estrogonofe, tapioca, arroz carreteiro e tacacá possuem sprite próprio;
- os demais grupos usam um fallback semântico (proteína, lácteo, bebida, gordura, doce ou refeição).

## Convenção para novas ilustrações

1. Gerar sprites de seis células (3 × 2), sem texto e com fundo transparente.
2. Criar as classes `.illustration--<chave>` no componente `food-illustration`.
3. Adicionar a chave antes dos fallbacks em `FoodIllustrationResolver`.
4. Executar `php artisan foods:assign-illustrations --dry-run` e revisar a distribuição.
5. Executar `php artisan foods:assign-illustrations` para gravar somente diferenças.
