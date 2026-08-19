import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import type { DashboardResumo } from '../../core/models/dashboard.model';
import { LanguageService } from '../../core/i18n/language.service';
import { gateCarregamento } from '../../components/utils/loading-gate.util';
import { LoadingStateComponent } from '../../components/molecules/loading-state/loading-state.component';
import { BadgeCardComponent } from './components/badge-card/badge-card.component';
import { MissionCardComponent } from './components/mission-card/mission-card.component';
import { MissionsCardComponent } from './components/missions-card/missions-card.component';
import { WeekTrailComponent } from './components/week-trail/week-trail.component';
import { ShortcutsRowComponent } from './components/shortcuts-row/shortcuts-row.component';

@Component({
  selector: 'vtp-dashboard',
  standalone: true,
  imports: [
    LoadingStateComponent,
    BadgeCardComponent,
    MissionCardComponent,
    MissionsCardComponent,
    WeekTrailComponent,
    ShortcutsRowComponent,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnDestroy {
  private readonly dashboard = inject(DashboardService);
  private readonly language = inject(LanguageService);
  private readonly destruido = new Subject<void>();

  protected readonly resumo = signal<DashboardResumo | null>(null);
  protected readonly carregando = signal(true);
  protected readonly carregandoVisivel = gateCarregamento(this.carregando);

  private idiomaInicializado = false;

  constructor() {
    this.carregar();

    effect(() => {
      this.language.locale();
      if (!this.idiomaInicializado) {
        this.idiomaInicializado = true;

        return;
      }

      untracked(() => this.carregar());
    });
  }

  private carregar(): void {
    this.carregando.set(true);
    this.dashboard
      .resumo()
      .pipe(
        takeUntil(this.destruido),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe((resumo) => this.resumo.set(resumo));
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }
}
