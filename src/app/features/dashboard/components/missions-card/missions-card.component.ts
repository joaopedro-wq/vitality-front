import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { DashboardMissao, DashboardProgressao } from '../../../../core/models/dashboard.model';

interface MissaoTrilha extends DashboardMissao {
  estado: 'done' | 'current' | 'locked';
}

@Component({
  selector: 'vtp-missions-card',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './missions-card.component.html',
  styleUrl: './missions-card.component.scss',
  host: { class: 'card animate-reveal p-5' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionsCardComponent {
  readonly progressao = input.required<DashboardProgressao>();

  protected readonly trilha = computed<MissaoTrilha[]>(() => {
    const p = this.progressao();
    const todas = [...p.diarias, ...p.semanais, ...p.marcos];
    const indiceAtual = todas.findIndex((missao) => !missao.concluida);

    return todas.map((missao, indice) => ({
      ...missao,
      estado: missao.concluida ? 'done' : indice === indiceAtual ? 'current' : 'locked',
    }));
  });

  protected readonly tudoConcluido = computed(() =>
    this.trilha().every((missao) => missao.estado === 'done'),
  );
}
