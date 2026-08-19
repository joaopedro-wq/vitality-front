import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import {
  LucideCarrot,
  LucideChevronRight,
  LucideClipboardList,
  LucideDynamicIcon,
  LucideTarget,
  LucideUtensils,
  type LucideIcon,
} from '@lucide/angular';

import { LanguageService } from '../../../../core/i18n/language.service';
import type { DashboardResumo } from '../../../../core/models/dashboard.model';

interface Atalho {
  path: string;
  icone: LucideIcon;
  nome: string;
  status: string;
}

@Component({
  selector: 'vtp-shortcuts-row',
  standalone: true,
  imports: [RouterLink, LucideDynamicIcon, LucideChevronRight],
  templateUrl: './shortcuts-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutsRowComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);

  readonly resumo = input.required<DashboardResumo>();

  protected readonly atalhos = computed<Atalho[]>(() => {
    this.language.locale();
    const t = (key: string, params?: Record<string, unknown>) =>
      this.transloco.translate(key, params);
    const resumo = this.resumo();

    return [
      {
        path: '/diario',
        icone: LucideUtensils,
        nome: t('dashboard.shortcuts.diary'),
        status: resumo.proxima_refeicao
          ? t('dashboard.shortcuts.diaryPending', { meal: resumo.proxima_refeicao.descricao })
          : t('dashboard.shortcuts.diaryDone'),
      },
      {
        path: '/dietas',
        icone: LucideClipboardList,
        nome: t('dashboard.shortcuts.plan'),
        status: resumo.plano_ativo
          ? t('dashboard.shortcuts.planAdherence', { pct: resumo.plano_ativo.aderencia_7d })
          : t('dashboard.shortcuts.planNone'),
      },
      {
        path: '/metas',
        icone: LucideTarget,
        nome: t('dashboard.shortcuts.goals'),
        status: resumo.hoje.meta
          ? t('dashboard.shortcuts.goalsSet')
          : t('dashboard.shortcuts.goalsUnset'),
      },
      {
        path: '/alimentos',
        icone: LucideCarrot,
        nome: t('dashboard.shortcuts.foods'),
        status: resumo.mais_consumidos[0]
          ? t('dashboard.shortcuts.foodsTop', { food: resumo.mais_consumidos[0].descricao })
          : t('dashboard.shortcuts.foodsExplore'),
      },
    ];
  });
}
