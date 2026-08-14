import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideArchive, LucidePlus, LucideSave, LucideX } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import type { DiaryMeal } from '../../../core/models/diary.model';
import { DiarioService } from '../../../services/diario.service';

@Component({
  selector: 'vtp-meal-manager',
  standalone: true,
  imports: [BdButtonComponent, LucideArchive, LucidePlus, LucideSave, LucideX],
  templateUrl: './meal-manager.component.html',
  styleUrl: './meal-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealManagerComponent {
  readonly meals = input.required<DiaryMeal[]>();
  readonly closed = output<void>();
  readonly changed = output<void>();

  private readonly diary = inject(DiarioService);
  private readonly toastr = inject(ToastrService);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly newDescription = signal('');
  protected readonly newTime = signal('12:00');

  protected saveExisting(meal: DiaryMeal, description: string, time: string, order: number): void {
    this.saving.set(true);
    this.diary
      .updateMeal(meal.id, { descricao: description, horario: time, ordem: order })
      .pipe(finalize(() => this.saving.set(false)))
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
      .pipe(finalize(() => this.saving.set(false)))
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
    this.diary.archiveMeal(meal.id).subscribe({
      next: () => {
        this.toastr.success('Refeição arquivada.');
        this.changed.emit();
      },
      error: () => this.toastr.error('Não foi possível arquivar a refeição.'),
    });
  }
}
