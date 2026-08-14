import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheckCircle2,
  LucideCirclePlus,
  LucideEdit3,
  LucideSettings2,
  LucideTrash2,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';

import { DailyCheckpointTrackComponent } from '../../../components/molecules/daily-checkpoint-track/daily-checkpoint-track.component';
import { DiaryDaySummaryComponent } from '../../../components/molecules/diary-day-summary/diary-day-summary.component';
import type {
  DiaryDay,
  DiaryEntry,
  DiaryMacros,
  DiaryMeal,
} from '../../../core/models/diary.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import { DiarioService } from '../../../services/diario.service';
import { MetaService } from '../../../services/meta.service';
import { EntryComposerComponent } from '../entry-composer/entry-composer.component';
import { MealManagerComponent } from '../meal-manager/meal-manager.component';

const EMPTY_TOTALS: DiaryMacros = { caloria: 0, proteina: 0, carbo: 0, gordura: 0, quantidade: 0 };

@Component({
  selector: 'vtp-diario-list',
  standalone: true,
  imports: [
    DecimalPipe,
    BdButtonComponent,
    DailyCheckpointTrackComponent,
    DiaryDaySummaryComponent,
    EntryComposerComponent,
    MealManagerComponent,
    LucideArrowLeft,
    LucideArrowRight,
    LucideCalendarDays,
    LucideCheckCircle2,
    LucideCirclePlus,
    LucideEdit3,
    LucideSettings2,
    LucideTrash2,
  ],
  templateUrl: './diario-list.component.html',
  styleUrl: './diario-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiarioListComponent {
  private readonly diaryService = inject(DiarioService);
  private readonly metaService = inject(MetaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly today = this.dateString(new Date());
  protected readonly selectedDate = signal(this.today);
  protected readonly day = signal<DiaryDay | null>(null);
  protected readonly meals = signal<DiaryMeal[]>([]);
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly loading = signal(true);
  protected readonly composerOpen = signal(false);
  protected readonly managerOpen = signal(false);
  protected readonly selectedMeal = signal<DiaryMeal | null>(null);
  protected readonly editingEntry = signal<DiaryEntry | null>(null);
  protected readonly totals = computed(() => this.day()?.totals ?? EMPTY_TOTALS);
  protected readonly canGoNext = computed(() => this.selectedDate() < this.today);
  protected readonly dateLabel = computed(() => {
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  });

  constructor() {
    this.load();
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('registrar') === '1') this.composerOpen.set(true);
    });
  }

  protected previousDay(): void {
    this.changeDay(-1);
  }

  protected nextDay(): void {
    if (this.canGoNext()) this.changeDay(1);
  }

  protected goToday(): void {
    if (this.selectedDate() === this.today) return;
    this.selectedDate.set(this.today);
    this.load();
  }

  protected entriesFor(mealId: number): DiaryEntry[] {
    return this.day()?.entries.filter((entry) => entry.meal.id === mealId) ?? [];
  }

  protected openComposer(meal: DiaryMeal | null = null, entry: DiaryEntry | null = null): void {
    this.selectedMeal.set(
      meal ?? (entry ? (this.meals().find((item) => item.id === entry.meal.id) ?? null) : null),
    );
    this.editingEntry.set(entry);
    this.composerOpen.set(true);
  }

  protected closeComposer(): void {
    this.composerOpen.set(false);
    this.selectedMeal.set(null);
    this.editingEntry.set(null);
    if (this.route.snapshot.queryParamMap.has('registrar')) {
      this.router.navigate([], {
        queryParams: { registrar: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  protected onEntrySaved(): void {
    this.closeComposer();
    this.loadDay();
  }

  protected onMealsChanged(): void {
    this.managerOpen.set(false);
    this.loadMeals();
  }

  protected deleteEntry(entry: DiaryEntry): void {
    if (!window.confirm('Excluir este lançamento? Essa ação não pode ser desfeita.')) return;
    this.diaryService.deleteEntry(entry.id).subscribe({
      next: () => {
        this.toastr.success('Lançamento removido.');
        this.loadDay();
      },
      error: () => this.toastr.error('Não foi possível remover o lançamento.'),
    });
  }

  protected formatTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(value),
    );
  }

  protected entryDescription(entry: DiaryEntry): string {
    return entry.items.map((item) => item.descricao).join(' · ');
  }

  private changeDay(days: number): void {
    const next = new Date(`${this.selectedDate()}T12:00:00`);
    next.setDate(next.getDate() + days);
    const value = this.dateString(next);
    if (value > this.today) return;
    this.selectedDate.set(value);
    this.loadDay();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      day: this.diaryService.day(this.selectedDate()),
      meals: this.diaryService.meals(),
      metas: this.metaService.list(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ day, meals, metas }) => {
          this.day.set(day);
          this.meals.set(meals);
          this.meta.set(
            metas.find((item) => item.data === this.selectedDate()) ??
              metas.find((item) => item.data === null) ??
              metas[0] ??
              null,
          );
        },
        error: () => this.toastr.error('Não foi possível carregar seu Diário agora.'),
      });
  }

  private loadDay(): void {
    this.diaryService.day(this.selectedDate()).subscribe({
      next: (day) => this.day.set(day),
      error: () => this.toastr.error('Não foi possível atualizar os lançamentos.'),
    });
  }

  private loadMeals(): void {
    this.diaryService.meals().subscribe({
      next: (meals) => this.meals.set(meals),
      error: () => this.toastr.error('Não foi possível atualizar as refeições.'),
    });
  }

  private dateString(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
}
