import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideSearch } from '@lucide/angular';
import { Subject, catchError, debounceTime, finalize, forkJoin, of, takeUntil } from 'rxjs';

import { DiaryDestinationBandComponent } from '../../../components/molecules/diary-destination-band/diary-destination-band.component';
import { FoodPickCardComponent } from '../../../components/molecules/food-pick-card/food-pick-card.component';
import {
  PlateRowComponent,
  type PlateItem,
} from '../../../components/molecules/plate-row/plate-row.component';
import { StepFooterComponent } from '../../../components/molecules/step-footer/step-footer.component';
import { escalarMacros, somarMacros } from '../../../components/utils/diary-day.util';
import type { Alimento } from '../../../core/models/alimento.model';
import type { DiaryEntry, DiaryMacros, DiaryMeal } from '../../../core/models/diary.model';
import { AlimentoService } from '../../../services/alimento.service';
import { DiarioService } from '../../../services/diario.service';

/**
 * Registrar em uma tela só.
 *
 * Não há passos: a refeição já foi escolhida ao tocar a fase no mapa — por isso
 * ela aparece como faixa de destino no topo, e não como pergunta — e a navegação
 * é só o par de botões redondos do rodapé: voltar cancela, avançar grava.
 */
@Component({
  selector: 'vtp-entry-composer',
  standalone: true,
  imports: [
    DecimalPipe,
    DiaryDestinationBandComponent,
    FoodPickCardComponent,
    PlateRowComponent,
    StepFooterComponent,
    LucideSearch,
  ],
  templateUrl: './entry-composer.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComposerComponent implements OnDestroy {
  readonly meal = input.required<DiaryMeal>();
  readonly meals = input.required<DiaryMeal[]>();
  readonly date = input.required<string>();
  /** Presente = editando um lançamento existente em vez de criar um novo. */
  readonly entry = input<DiaryEntry | null>(null);

  readonly cancelado = output<void>();
  readonly salvo = output<void>();
  readonly trocarMeal = output<DiaryMeal>();

  private readonly foodsService = inject(AlimentoService);
  private readonly diary = inject(DiarioService);
  private readonly buscas = new Subject<string>();
  private readonly destruido = new Subject<void>();

  protected readonly query = signal('');
  protected readonly foods = signal<Alimento[]>([]);
  protected readonly atalhos = signal<Alimento[]>([]);
  protected readonly carregandoFoods = signal(false);
  protected readonly itens = signal<PlateItem[]>([]);
  protected readonly salvando = signal(false);
  protected readonly trocaAberta = signal(false);
  protected readonly hora = signal('12:00');

  protected readonly catalogo = computed(() => (this.query() ? this.foods() : this.atalhos()));

  protected readonly totais = computed<DiaryMacros>(() =>
    somarMacros(
      this.itens().map((item) => ({
        macros: escalarMacros(item.macrosRef, item.qtdRef, item.quantity),
      })),
    ),
  );

  constructor() {
    this.buscas.pipe(debounceTime(300), takeUntil(this.destruido)).subscribe((termo) => {
      this.query.set(termo);
      if (termo) this.buscarAlimentos();
      else this.foods.set([]);
    });

    this.carregarAtalhos();

    // Rascunho novo a cada troca de destino ou de lançamento em edição.
    effect(() => {
      const entry = this.entry();
      const meal = this.meal();
      const date = this.date();

      this.trocaAberta.set(false);

      if (entry) {
        this.hora.set(new Date(entry.consumed_at).toTimeString().slice(0, 5));
        this.itens.set(
          entry.items.map((item) => ({
            foodId: item.food_id,
            descricao: item.descricao,
            illustrationKey: item.illustration_key,
            quantity: item.quantity,
            // O snapshot de macros do backend corresponde exatamente à quantidade
            // gravada — é essa a referência, não a porção do catálogo.
            qtdRef: item.quantity,
            macrosRef: item.macros,
          })),
        );
        this.resolverPorcoesBase(entry.items.map((item) => item.food_id));
        return;
      }

      this.hora.set(this.horaSugerida(meal, date));
      this.itens.set([]);
    });
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected buscar(termo: string): void {
    this.buscas.next(termo.trim());
  }

  protected escolher(food: Alimento): void {
    if (this.estaNoPrato(food)) {
      this.tirar(food.id);
      return;
    }

    this.itens.update((itens) => [
      ...itens,
      {
        foodId: food.id,
        descricao: food.descricao,
        illustrationKey: food.illustration_key,
        quantity: food.qtd,
        qtdRef: food.qtd,
        macrosRef: {
          caloria: food.caloria,
          proteina: food.proteina,
          carbo: food.carbo,
          gordura: food.gordura,
        },
        porcaoBase: food.qtd,
      },
    ]);
  }

  protected estaNoPrato(food: Alimento): boolean {
    return this.itens().some((item) => item.foodId === food.id);
  }

  protected ajustarQuantidade(foodId: number, quantidade: number): void {
    this.itens.update((itens) =>
      itens.map((item) => (item.foodId === foodId ? { ...item, quantity: quantidade } : item)),
    );
  }

  protected tirar(foodId: number): void {
    this.itens.update((itens) => itens.filter((item) => item.foodId !== foodId));
  }

  protected salvar(): void {
    const itens = this.itens();
    if (!itens.length) return;

    const consumidoEm = new Date(`${this.date()}T${this.hora()}:00`);
    if (Number.isNaN(consumidoEm.getTime())) return;

    const payload = {
      meal_id: this.meal().id,
      consumed_at: consumidoEm.toISOString(),
      items: itens.map((item) => ({ food_id: item.foodId, quantity: item.quantity })),
    };

    const entry = this.entry();
    this.salvando.set(true);

    const requisicao = entry
      ? this.diary.updateEntry(entry.id, payload)
      : this.diary.createEntry(payload);

    // Sem toast de erro próprio: o `errorInterceptor` já mostra a mensagem real do
    // backend — inclusive a de consumo futuro, que é a que mais aparece aqui.
    requisicao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => this.salvo.emit(),
      error: () => undefined,
    });
  }

  /**
   * O backend recusa consumo no futuro. Como cada fase sugere o próprio horário,
   * abrir o jantar no meio da tarde cairia direto num 422 — então, no dia de
   * hoje, a sugestão nunca passa da hora atual.
   */
  private horaSugerida(meal: DiaryMeal, date: string): string {
    const daRefeicao = meal.horario.slice(0, 5);
    const agora = new Date();
    const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);

    if (date !== hoje) return daRefeicao;

    const horaAtual = agora.toTimeString().slice(0, 5);
    return daRefeicao > horaAtual ? horaAtual : daRefeicao;
  }

  private carregarAtalhos(): void {
    forkJoin({
      recentes: this.diary.recentFoods().pipe(catchError(() => of<Alimento[]>([]))),
      favoritos: this.foodsService
        .list({ tab: 'favorites', page: 1 })
        .pipe(catchError(() => of({ data: [] as Alimento[] }))),
    }).subscribe(({ recentes, favoritos }) => {
      const vistos = new Set<number>();
      const juntos = [...recentes, ...favoritos.data].filter((food) => {
        if (vistos.has(food.id)) return false;
        vistos.add(food.id);
        return true;
      });
      this.atalhos.set(juntos.slice(0, 12));
    });
  }

  private buscarAlimentos(): void {
    this.carregandoFoods.set(true);
    this.foodsService
      .list({ tab: 'all', search: this.query(), page: 1 })
      .pipe(finalize(() => this.carregandoFoods.set(false)))
      .subscribe({
        next: (pagina) => this.foods.set(pagina.data),
        error: () => this.foods.set([]),
      });
  }

  /**
   * Um item já lançado não traz a porção de referência do catálogo, e sem ela os
   * chips de porção não significam nada. Procura primeiro no que já está em
   * memória e só busca na API o que faltar; alimento arquivado simplesmente fica
   * sem chips, em vez de inventar uma base errada.
   */
  private resolverPorcoesBase(foodIds: number[]): void {
    const bases = new Map<number, number>(
      [...this.atalhos(), ...this.foods()].map((food) => [food.id, food.qtd]),
    );
    const faltantes = foodIds.filter((id) => !bases.has(id));

    if (!faltantes.length) {
      this.aplicarPorcoesBase(bases);
      return;
    }

    forkJoin(faltantes.map((id) => this.foodsService.get(id).pipe(catchError(() => of(null)))))
      .pipe(takeUntil(this.destruido))
      .subscribe((resultados) => {
        for (const food of resultados) {
          if (food) bases.set(food.id, food.qtd);
        }
        this.aplicarPorcoesBase(bases);
      });
  }

  private aplicarPorcoesBase(bases: Map<number, number>): void {
    this.itens.update((itens) =>
      itens.map((item) => ({ ...item, porcaoBase: bases.get(item.foodId) })),
    );
  }
}
