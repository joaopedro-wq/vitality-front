import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { BdButtonComponent, BdModalComponent } from 'bandeira-ui';
import { LucideArchive, LucideCheck, LucideDynamicIcon, LucidePlus } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, takeUntil } from 'rxjs';

import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { ICONE_POR_MOMENTO, momentoDaRefeicao } from '../../../components/utils/diary-day.util';
import type { DiaryMeal } from '../../../core/models/diary.model';
import { DiarioService } from '../../../services/diario.service';

@Component({
  selector: 'vtp-meal-manager',
  standalone: true,
  imports: [
    PlateLoaderComponent,
    BdButtonComponent,
    BdModalComponent,
    LucideArchive,
    LucideCheck,
    LucideDynamicIcon,
    LucidePlus,
  ],
  templateUrl: './meal-manager.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealManagerComponent implements OnDestroy {
  readonly meals = input.required<DiaryMeal[]>();
  readonly closed = output<void>();
  readonly changed = output<void>();

  private readonly diary = inject(DiarioService);
  private readonly toastr = inject(ToastrService);
  private readonly destruido = new Subject<void>();
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly newDescription = signal('');
  protected readonly newTime = signal('12:00');

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  /** Mesmo ícone que o disco da fase usa na trilha — a estação aqui é o mesmo
   * dado, só num modo de edição, não uma tela à parte. */
  protected iconePorMomento(meal: DiaryMeal) {
    return ICONE_POR_MOMENTO[momentoDaRefeicao(meal.descricao)];
  }

  /** `bd-modal` fecha sozinho no Esc/clique no fundo/X — isso só repassa pro
   * pai, que é quem decide destruir o componente (`@if (managerOpen())`). */
  protected onOpenChange(open: boolean): void {
    if (!open) this.closed.emit();
  }

  protected saveExisting(meal: DiaryMeal, description: string, time: string, order: number): void {
    this.saving.set(true);
    this.diary
      .updateMeal(meal.id, { descricao: description, horario: time, ordem: order })
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Refeição atualizada.');
          this.changed.emit();
        },
        error: () => this.toastr.error('Não foi possível atualizar a refeição.'),
      });
  }

  protected add(): void {
    if (!this.newDescription().trim()) return;
    this.saving.set(true);
    this.diary
      .createMeal({
        descricao: this.newDescription().trim(),
        horario: this.newTime(),
        ordem: this.meals().length + 1,
      })
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.adding.set(false);
          this.newDescription.set('');
          this.changed.emit();
        },
        error: () => this.toastr.error('Não foi possível criar a refeição.'),
      });
  }

  protected archive(meal: DiaryMeal): void {
    if (!window.confirm(`Arquivar ${meal.descricao}? Os registros antigos continuarão visíveis.`))
      return;
    this.diary
      .archiveMeal(meal.id)
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: () => {
          this.toastr.success('Refeição arquivada.');
          this.changed.emit();
        },
        error: () => this.toastr.error('Não foi possível arquivar a refeição.'),
      });
  }
}
