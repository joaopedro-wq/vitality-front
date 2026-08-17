import { DecimalPipe } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  HostListener,
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
import { NutritionRevealComponent } from '../../../components/molecules/nutrition-reveal/nutrition-reveal.component';
import { escalarMacros, somarMacros } from '../../../components/utils/diary-day.util';
import { somarNutrientesDaRefeicao } from '../../../components/utils/meal-nutrition.util';
import type { Alimento } from '../../../core/models/alimento.model';
import type {
  DiaryEntry,
  DiaryMacros,
  DiaryMeal,
  DiaryNutrient,
} from '../../../core/models/diary.model';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { AlimentoService } from '../../../services/alimento.service';
import { DiarioService } from '../../../services/diario.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
import { MealPlanService } from '../../../services/meal-plan.service';
import type { MealPlan, MealPlanMeal } from '../../../core/models/meal-plan.model';

@Component({
  selector: 'vtp-entry-composer',
  standalone: true,
  imports: [
    DecimalPipe,
    CdkTrapFocus,
    DiaryDestinationBandComponent,
    FoodPickCardComponent,
    PlateRowComponent,
    StepFooterComponent,
    NutritionRevealComponent,
    LucideSearch,
    LoadingStateComponent,
  ],
  templateUrl: './entry-composer.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComposerComponent implements OnDestroy {
  readonly meal = input.required<DiaryMeal>();
  readonly meals = input.required<DiaryMeal[]>();
  readonly date = input.required<string>();
  readonly entry = input<DiaryEntry | null>(null);

  readonly cancelado = output<void>();
  readonly salvo = output<void>();
  readonly trocarMeal = output<DiaryMeal>();

  private readonly foodsService = inject(AlimentoService);
  private readonly diary = inject(DiarioService);
  private readonly planDraft = inject(MealPlanDiaryDraftService);
  private readonly plansService = inject(MealPlanService);
  private readonly buscas = new Subject<string>();
  private readonly destruido = new Subject<void>();
  private requisicaoDeNutrientes = 0;

  protected readonly query = signal('');
  protected readonly foods = signal<Alimento[]>([]);
  protected readonly atalhos = signal<Alimento[]>([]);
  protected readonly carregandoFoods = signal(false);
  protected readonly carregandoFoodsVisivel = gateCarregamento(this.carregandoFoods);
  protected readonly itens = signal<PlateItem[]>([]);
  protected readonly salvando = signal(false);
  protected readonly trocaAberta = signal(false);
  protected readonly hora = signal('12:00');
  protected readonly passo = signal<'selecionar' | 'revisar'>('selecionar');
  protected readonly nutrientes = signal<DiaryNutrient[]>([]);
  protected readonly carregandoNutrientes = signal(false);
  protected readonly seletorPlanoAberto = signal(false);
  protected readonly carregandoPlanos = signal(false);
  protected readonly planos = signal<MealPlan[]>([]);
  protected readonly planoAtivo = signal<MealPlan | null>(null);

  protected readonly refeicaoSugerida = computed<MealPlanMeal | null>(() => {
    const plano = this.planoAtivo();
    if (!plano?.meals.length) return null;

    const alvo = this.normalizar(this.meal().descricao);
    const exata = plano.meals.find((refeicao) => {
      const nome = this.normalizar(refeicao.descricao);
      return nome.includes(alvo) || alvo.includes(nome);
    });
    if (exata) return exata;

    const horaAlvo = this.minutos(this.meal().horario);
    return (
      [...plano.meals].sort(
        (a, b) =>
          Math.abs(this.minutos(a.horario) - horaAlvo) -
          Math.abs(this.minutos(b.horario) - horaAlvo),
      )[0] ?? null
    );
  });

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
      this.seletorPlanoAberto.set(false);
      this.planoAtivo.set(null);
      this.passo.set('selecionar');
      this.nutrientes.set([]);
      this.carregandoNutrientes.set(false);
      this.requisicaoDeNutrientes += 1;

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
      const planDraft = this.planDraft.takeFor(meal.id);
      if (!planDraft) {
        this.itens.set([]);
        return;
      }
      this.itens.set(
        planDraft.items.map((item) => ({
          foodId: item.food_id,
          descricao: item.descricao,
          illustrationKey: null,
          quantity: item.quantity,
          qtdRef: item.quantity,
          macrosRef: item.macros,
        })),
      );
      this.resolverPorcoesBase(planDraft.items.map((item) => item.food_id));
    });
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected buscar(termo: string): void {
    this.buscas.next(termo.trim());
  }

  /** Abre a biblioteca de planos sem substituir o que já foi escolhido no prato. */
  protected abrirSeletorPlano(): void {
    this.seletorPlanoAberto.set(true);
    if (this.planos().length || this.carregandoPlanos()) return;

    this.carregandoPlanos.set(true);
    this.plansService
      .list()
      .pipe(finalize(() => this.carregandoPlanos.set(false)))
      .subscribe({
        next: (planos) => {
          const ativos = planos.filter((plano) => !plano.archived_at);
          this.planos.set(ativos);
          if (ativos.length === 1) this.planoAtivo.set(ativos[0]);
        },
        error: () => this.planos.set([]),
      });
  }

  protected fecharSeletorPlano(): void {
    this.seletorPlanoAberto.set(false);
    this.planoAtivo.set(null);
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected fecharSeletorPlanoComEscape(event: Event): void {
    if (this.seletorPlanoAberto()) {
      event.preventDefault();
      this.fecharSeletorPlano();
    }
  }

  protected selecionarPlano(plano: MealPlan): void {
    this.planoAtivo.set(plano);
  }

  /** Copia a refeição do plano para o editor; porções e itens continuam editáveis. */
  protected aplicarRefeicaoDoPlano(refeicao: MealPlanMeal): void {
    this.itens.set(
      refeicao.items.map((item) => ({
        foodId: item.food_id,
        descricao: item.descricao,
        illustrationKey: null,
        quantity: item.quantity,
        qtdRef: item.quantity,
        macrosRef: item.macros,
      })),
    );
    this.resolverPorcoesBase(refeicao.items.map((item) => item.food_id));
    this.fecharSeletorPlano();
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

  protected voltar(): void {
    if (this.passo() === 'revisar') {
      this.requisicaoDeNutrientes += 1;
      this.carregandoNutrientes.set(false);
      this.passo.set('selecionar');
      return;
    }
    this.cancelado.emit();
  }

  protected avancar(): void {
    if (this.passo() === 'selecionar') {
      if (!this.itens().length) return;
      this.abrirRevisao();
      return;
    }
    this.salvar();
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

  private abrirRevisao(): void {
    const itens = this.itens();
    const requisicaoAtual = ++this.requisicaoDeNutrientes;
    this.nutrientes.set([]);
    this.carregandoNutrientes.set(true);
    this.passo.set('revisar');

    forkJoin(
      itens.map((item) => this.foodsService.get(item.foodId).pipe(catchError(() => of(null)))),
    )
      .pipe(
        takeUntil(this.destruido),
        finalize(() => {
          if (requisicaoAtual === this.requisicaoDeNutrientes) {
            this.carregandoNutrientes.set(false);
          }
        }),
      )
      .subscribe((alimentos) => {
        if (requisicaoAtual !== this.requisicaoDeNutrientes) return;
        this.nutrientes.set(
          somarNutrientesDaRefeicao(
            itens,
            alimentos.filter((alimento): alimento is Alimento => alimento !== null),
          ),
        );
      });
  }

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

  private normalizar(valor: string): string {
    return valor
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private minutos(valor: string): number {
    const [hora, minuto] = valor.split(':').map(Number);
    return (hora || 0) * 60 + (minuto || 0);
  }
}
