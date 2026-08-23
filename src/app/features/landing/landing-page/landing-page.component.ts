import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  LucideArrowDown,
  LucideArrowRight,
  LucideBookOpen,
  LucideCalculator,
  LucideGift,
  LucideGlobe,
  LucidePieChart,
  LucideSalad,
  LucideTrophy,
} from '@lucide/angular';
import {
  BdAccordionComponent,
  BdButtonComponent,
  BdCountUpDirective,
  BdRevealDirective,
} from 'bandeira-ui';
import type { BdAccordionItem } from 'bandeira-ui';

import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'vtp-landing-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoDirective,
    BdButtonComponent,
    BdAccordionComponent,
    BdCountUpDirective,
    BdRevealDirective,
    LucideArrowDown,
    LucideArrowRight,
    LucideBookOpen,
    LucideCalculator,
    LucideGift,
    LucideGlobe,
    LucidePieChart,
    LucideSalad,
    LucideTrophy,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(LanguageService);

  protected readonly navScrolled = signal(false);
  protected readonly scrollProgress = signal(0);

  @HostListener('window:scroll')
  protected onScroll(): void {
    this.navScrolled.set(window.scrollY > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress.set(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
  }

  protected readonly faqItems = computed<BdAccordionItem[]>(() => {
    this.language.locale();
    const t = (key: string) => this.transloco.translate(`landing.faq.${key}`);
    return [
      { id: 'q1', title: t('q1'), content: t('a1') },
      { id: 'q2', title: t('q2'), content: t('a2') },
      { id: 'q3', title: t('q3'), content: t('a3') },
      { id: 'q4', title: t('q4'), content: t('a4') },
      { id: 'q5', title: t('q5'), content: t('a5') },
    ];
  });

  protected readonly faqOpened = signal<string[]>([]);
}
