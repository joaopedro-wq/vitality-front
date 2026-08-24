import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  LucideArrowDown,
  LucideCalendarCheck,
  LucideChartNoAxesCombined,
  LucideCheck,
  LucideClipboardList,
  LucideInfo,
  LucideRefreshCw,
} from '@lucide/angular';
import { BdAccordionComponent, BdButtonComponent, BdRevealDirective } from 'bandeira-ui';
import type { BdAccordionItem } from 'bandeira-ui';

import { LanguageService } from '../../../core/i18n/language.service';

type LandingFeatureId = 'plan' | 'diary' | 'macros' | 'swaps';

interface LandingFeature {
  id: LandingFeatureId;
  image: string;
}

@Component({
  selector: 'vtp-landing-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoDirective,
    BdButtonComponent,
    BdAccordionComponent,
    BdRevealDirective,
    LucideArrowDown,
    LucideCalendarCheck,
    LucideChartNoAxesCombined,
    LucideCheck,
    LucideClipboardList,
    LucideInfo,
    LucideRefreshCw,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(LanguageService);

  protected readonly featureAtiva = signal<LandingFeatureId>('plan');
  protected readonly features: readonly LandingFeature[] = [
    { id: 'plan', image: 'images/landing/dietas-plano-gerado.png' },
    { id: 'diary', image: 'images/landing/diario.png' },
    { id: 'macros', image: 'images/landing/dashboard.png' },
    { id: 'swaps', image: 'images/landing/dietas-plano-gerado.png' },
  ];

  protected readonly faqItems = computed<BdAccordionItem[]>(() => {
    this.language.locale();
    const t = (key: string) => this.transloco.translate(`landing.faq.${key}`);
    return [
      { id: 'q1', title: t('q1'), content: t('a1') },
      { id: 'q2', title: t('q2'), content: t('a2') },
      { id: 'q3', title: t('q3'), content: t('a3') },
    ];
  });

  protected readonly faqOpened = signal<string[]>([]);
}
