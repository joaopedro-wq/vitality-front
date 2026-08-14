import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideCheck, LucideCircle } from '@lucide/angular';

import type { DiaryEntry, DiaryMeal } from '../../../core/models/diary.model';

export interface DailyCheckpoint {
  meal: DiaryMeal;
  status: 'concluido' | 'atual' | 'pendente';
  entries: number;
}

@Component({
  selector: 'vtp-daily-checkpoint-track',
  standalone: true,
  imports: [LucideCheck, LucideCircle],
  templateUrl: './daily-checkpoint-track.component.html',
  styleUrl: './daily-checkpoint-track.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyCheckpointTrackComponent {
  readonly meals = input.required<DiaryMeal[]>();
  readonly entries = input.required<DiaryEntry[]>();
  readonly choose = output<DiaryMeal>();

  protected readonly checkpoints = computed<DailyCheckpoint[]>(() => {
    const counts = new Map<number, number>();
    for (const entry of this.entries()) {
      counts.set(entry.meal.id, (counts.get(entry.meal.id) ?? 0) + 1);
    }
    let foundOpen = false;
    return this.meals().map((meal) => {
      const entries = counts.get(meal.id) ?? 0;
      const status: DailyCheckpoint['status'] = entries
        ? 'concluido'
        : !foundOpen
          ? ((foundOpen = true), 'atual')
          : 'pendente';
      return { meal, status, entries };
    });
  });
}
