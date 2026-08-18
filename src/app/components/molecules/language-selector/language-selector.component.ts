import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LanguageService, type SupportedLocale } from '../../../core/i18n/language.service';

@Component({
  selector: 'vtp-language-selector',
  standalone: true,
  imports: [TranslocoDirective],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectorComponent {
  protected readonly language = inject(LanguageService);
  toggle(): void {
    const next: SupportedLocale = this.language.locale() === 'pt-BR' ? 'en-US' : 'pt-BR';
    this.language.setLanguage(next);
  }
}
