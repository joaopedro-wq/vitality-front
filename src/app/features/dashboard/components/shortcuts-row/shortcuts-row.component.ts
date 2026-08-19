import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import {
  LucideCarrot,
  LucideClipboardList,
  LucideTarget,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import { ShortcutTrailNodeComponent } from '../../../../components/molecules/shortcut-trail-node/shortcut-trail-node.component';
import {
  TRILHA_ATALHOS_GRADE,
  TRILHA_ATALHOS_LINHA,
} from '../../../../components/utils/shortcut-trail.util';
import { LanguageService } from '../../../../core/i18n/language.service';
import type { DashboardResumo } from '../../../../core/models/dashboard.model';

interface Atalho {
  path: string;
  icone: LucideIcon;
  nome: string;
  status: string;

  progresso: number | null;
  corVar: string;
  ativo: boolean;
}

@Component({
  selector: 'vtp-shortcuts-row',
  standalone: true,
  imports: [RouterLink, ShortcutTrailNodeComponent],
  templateUrl: './shortcuts-row.component.html',
  host: { class: 'card animate-reveal p-5' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutsRowComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);

  readonly resumo = input.required<DashboardResumo>();

  protected readonly trilhaGrade = TRILHA_ATALHOS_GRADE;
  protected readonly trilhaLinha = TRILHA_ATALHOS_LINHA;

  protected readonly atalhos = computed<Atalho[]>(() => {
    this.language.locale();
    const t = (key: string, params?: Record<string, unknown>) =>
      this.transloco.translate(key, params);
    const resumo = this.resumo();

    const diarioAtivo = resumo.proxima_refeicao !== null;
    const metasAtivo = !diarioAtivo && resumo.hoje.meta === null;
    const planoAtivo = !diarioAtivo && !metasAtivo && resumo.plano_ativo === null;

    return [
      {
        path: '/diario',
        icone: LucideUtensils,
        nome: t('dashboard.shortcuts.diary'),
        status: resumo.proxima_refeicao
          ? t('dashboard.shortcuts.diaryPending', { meal: resumo.proxima_refeicao.descricao })
          : t('dashboard.shortcuts.diaryDone'),
        progresso: Math.min(resumo.hoje.percentual, 100),
        corVar: '--bd-primary',
        ativo: diarioAtivo,
      },
      {
        path: '/dietas',
        icone: LucideClipboardList,
        nome: t('dashboard.shortcuts.plan'),
        status: resumo.plano_ativo
          ? t('dashboard.shortcuts.planAdherence', { pct: resumo.plano_ativo.aderencia_7d })
          : t('dashboard.shortcuts.planNone'),
        progresso: resumo.plano_ativo?.aderencia_7d ?? 0,
        corVar: '--bd-accent',
        ativo: planoAtivo,
      },
      {
        path: '/metas',
        icone: LucideTarget,
        nome: t('dashboard.shortcuts.goals'),
        status: resumo.hoje.meta
          ? t('dashboard.shortcuts.goalsSet')
          : t('dashboard.shortcuts.goalsUnset'),
        progresso: resumo.hoje.meta ? 100 : 0,
        corVar: '--bd-primary',
        ativo: metasAtivo,
      },
      {
        path: '/alimentos',
        icone: LucideCarrot,
        nome: t('dashboard.shortcuts.foods'),
        status: resumo.mais_consumidos[0]
          ? t('dashboard.shortcuts.foodsTop', { food: resumo.mais_consumidos[0].descricao })
          : t('dashboard.shortcuts.foodsExplore'),
        progresso: null,
        corVar: '--bd-accent',
        ativo: false,
      },
    ];
  });
}
