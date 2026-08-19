import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import type { DashboardResumo } from '../../core/models/dashboard.model';
import { gateCarregamento } from '../../components/utils/loading-gate.util';
import { LoadingStateComponent } from '../../components/molecules/loading-state/loading-state.component';
import { BadgeCardComponent } from './components/badge-card/badge-card.component';
import { MissionCardComponent } from './components/mission-card/mission-card.component';
import { NextBadgeCardComponent } from './components/next-badge-card/next-badge-card.component';
import { WeekTrailComponent } from './components/week-trail/week-trail.component';
import { ShortcutsRowComponent } from './components/shortcuts-row/shortcuts-row.component';

@Component({
  selector: 'vtp-dashboard',
  standalone: true,
  imports: [
    LoadingStateComponent,
    BadgeCardComponent,
    MissionCardComponent,
    NextBadgeCardComponent,
    WeekTrailComponent,
    ShortcutsRowComponent,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnDestroy {
  private readonly dashboard = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private readonly destruido = new Subject<void>();

  protected readonly currentUser = this.auth.currentUser;
  protected readonly resumo = signal<DashboardResumo | null>(null);
  protected readonly carregando = signal(true);
  protected readonly carregandoVisivel = gateCarregamento(this.carregando);

  protected readonly nomeExibicao = computed(() => this.currentUser()?.name ?? '');

  constructor() {
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
