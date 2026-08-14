import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { BdButtonComponent } from 'bandeira-ui';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideMinus,
  LucidePlus,
  LucideSearch,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import type { Alimento } from '../../../core/models/alimento.model';
import type { DiaryEntry, DiaryMacros, DiaryMeal } from '../../../core/models/diary.model';
import { AlimentoService } from '../../../services/alimento.service';
import { DiarioService } from '../../../services/diario.service';

interface DraftItem {
  foodId: number;
  descricao: string;
  quantity: number;
  baseQuantity: number;
  macrosBase: DiaryMacros;
}

const STEP_LABELS = ['Momento', 'Prato', 'Revisão'];

@Component({
  selector: 'vtp-entry-composer',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    BdButtonComponent,
    LucideArrowLeft,
    LucideArrowRight,
    LucideCheck,
    LucideMinus,
    LucidePlus,
    LucideSearch,
    LucideTrash2,
    LucideX,
  ],
  templateUrl: './entry-composer.component.html',
  styleUrl: './entry-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComposerComponent implements OnInit {
  readonly meals = input.required<DiaryMeal[]>();
  readonly date = input.required<string>();
  readonly initialMeal = input<DiaryMeal | null>(null);
  readonly entry = input<DiaryEntry | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  private readonly foodsService = inject(AlimentoService);
  private readonly diary = inject(DiarioService);
  private readonly toastr = inject(ToastrService);

  protected readonly labels = STEP_LABELS;
  protected readonly step = signal(0);
  protected readonly mealId = signal<number | null>(null);
  protected readonly consumedAt = signal(this.datetimeLocal(new Date()));
  protected readonly query = signal('');
  protected readonly foods = signal<Alimento[]>([]);
  protected readonly loadingFoods = signal(false);
  protected readonly items = signal<DraftItem[]>([]);
  protected readonly saving = signal(false);
  protected readonly totals = computed<DiaryMacros>(() =>
    this.items().reduce(
      (total, item) => {
        const factor = item.baseQuantity > 0 ? item.quantity / item.baseQuantity : 0;
        total.caloria += item.macrosBase.caloria * factor;
        total.proteina += item.macrosBase.proteina * factor;
        total.carbo += item.macrosBase.carbo * factor;
        total.gordura += item.macrosBase.gordura * factor;
        return total;
      },
      { caloria: 0, proteina: 0, carbo: 0, gordura: 0 },
    ),
  );
  protected readonly selectedMeal = computed(
    () => this.meals().find((meal) => meal.id === this.mealId()) ?? null,
  );

  ngOnInit(): void {
    const entry = this.entry();
    if (entry) {
      this.mealId.set(entry.meal.id);
      this.consumedAt.set(this.datetimeLocal(new Date(entry.consumed_at)));
      this.items.set(
        entry.items.map((item) => ({
          foodId: item.food_id,
          descricao: item.descricao,
          quantity: item.quantity,
          baseQuantity: item.quantity,
          macrosBase: item.macros,
        })),
      );
      this.step.set(2);
    } else {
      const meal = this.initialMeal() ?? this.meals()[0] ?? null;
      this.mealId.set(meal?.id ?? null);
      this.consumedAt.set(`${this.date()}T${meal?.horario.slice(0, 5) ?? '12:00'}`);
      this.loadFoods(true);
    }
  }

  protected selectMeal(id: number): void {
    this.mealId.set(id);
  }

  protected setTime(value: string): void {
    this.consumedAt.set(value);
  }

  protected search(value: string): void {
    this.query.set(value);
    this.loadFoods(false);
  }

  protected addFood(food: Alimento): void {
    this.items.update((items) => {
      const found = items.find((item) => item.foodId === food.id);
      if (found)
        return items.map((item) =>
          item.foodId === food.id ? { ...item, quantity: item.quantity + food.qtd } : item,
        );
      return [
        ...items,
        {
          foodId: food.id,
          descricao: food.descricao,
          quantity: food.qtd,
          baseQuantity: food.qtd,
          macrosBase: {
            caloria: food.caloria,
            proteina: food.proteina,
            carbo: food.carbo,
            gordura: food.gordura,
          },
        },
      ];
    });
  }

  protected adjustQuantity(foodId: number, delta: number): void {
    this.items.update((items) =>
      items.map((item) =>
        item.foodId === foodId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      ),
    );
  }

  protected setQuantity(foodId: number, value: number): void {
    if (!Number.isFinite(value) || value <= 0) return;
    this.items.update((items) =>
      items.map((item) => (item.foodId === foodId ? { ...item, quantity: value } : item)),
    );
  }

  protected removeFood(foodId: number): void {
    this.items.update((items) => items.filter((item) => item.foodId !== foodId));
  }

  protected next(): void {
    if (this.step() === 0 && (!this.mealId() || !this.consumedAt())) {
      this.toastr.error('Escolha uma refeição e o horário do consumo.');
      return;
    }
    if (this.step() === 1 && this.items().length === 0) {
      this.toastr.error('Adicione pelo menos um alimento ao prato.');
      return;
    }
    this.step.update((value) => Math.min(value + 1, 2));
  }

  protected back(): void {
    this.step.update((value) => Math.max(value - 1, 0));
  }

  protected save(): void {
    const mealId = this.mealId();
    if (!mealId || this.items().length === 0) return;
    const local = new Date(this.consumedAt());
    if (Number.isNaN(local.getTime())) {
      this.toastr.error('Informe um horário válido.');
      return;
    }
    const payload = {
      meal_id: mealId,
      consumed_at: local.toISOString(),
      items: this.items().map((item) => ({ food_id: item.foodId, quantity: item.quantity })),
    };
    this.saving.set(true);
    const request = this.entry()
      ? this.diary.updateEntry(this.entry()!.id, payload)
      : this.diary.createEntry(payload);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toastr.success(
          this.entry()
            ? 'Lançamento atualizado.'
            : 'Refeição registrada. Você avançou mais um passo hoje.',
        );
        this.saved.emit();
      },
      error: () => this.toastr.error('Não foi possível salvar este lançamento agora.'),
    });
  }

  protected macroFor(item: DraftItem, key: keyof DiaryMacros): number {
    const value = item.macrosBase[key];
    return typeof value === 'number' ? value * (item.quantity / item.baseQuantity) : 0;
  }

  private loadFoods(favorites: boolean): void {
    this.loadingFoods.set(true);
    this.foodsService
      .list({
        tab: favorites && !this.query() ? 'favorites' : 'all',
        search: this.query(),
        page: 1,
      })
      .pipe(finalize(() => this.loadingFoods.set(false)))
      .subscribe({
        next: (page) => this.foods.set(page.data),
        error: () => this.toastr.error('Não foi possível carregar os alimentos.'),
      });
  }

  private datetimeLocal(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
