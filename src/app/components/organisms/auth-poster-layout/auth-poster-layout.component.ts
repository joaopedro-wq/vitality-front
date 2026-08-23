import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageSelectorComponent } from '../../molecules/language-selector/language-selector.component';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'vtp-auth-poster-layout',
  standalone: true,
  imports: [LanguageSelectorComponent, RouterLink],
  templateUrl: './auth-poster-layout.component.html',
  styleUrl: './auth-poster-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPosterLayoutComponent {
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  readonly badge = input<string>('');
  protected readonly eyebrow = computed(() => {
    this.language.locale();
    return this.transloco.translate('auth.eyebrow');
  });
}
