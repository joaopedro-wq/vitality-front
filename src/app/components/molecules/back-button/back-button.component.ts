import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'vtp-back-button',
  standalone: true,
  imports: [LucideArrowLeft],
  templateUrl: './back-button.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);

  readonly rotulo = input('Voltar');
  readonly fallbackRota = input('/dashboard');
  protected readonly rotuloResolvido = computed(() => {
    this.language.locale();
    const value = this.rotulo();
    if (value === 'Voltar') return this.transloco.translate('common.actions.back');
    if (value === 'Biblioteca') return this.transloco.translate('pageTitle.library');
    return value;
  });

  protected voltar(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl(this.fallbackRota());
    }
  }
}
