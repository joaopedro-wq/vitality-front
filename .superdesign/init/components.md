# Shared components

## `LanguageSelectorComponent`

- Source: `src/app/components/molecules/language-selector/language-selector.component.ts`
- Description: Compact locale toggle reused inside the authenticated app chrome.

```ts
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
```

```html
<div class="language-selector" *transloco="let t">
  <button
    type="button"
    class="flag-button"
    [attr.aria-label]="t('common.language.change')"
    (click)="toggle()"
  >
    <span class="flag" aria-hidden="true">{{ language.locale() === 'pt-BR' ? '🇧🇷' : '🇺🇸' }}</span>
  </button>
</div>
```

`bandeira-ui` supplies the project button, card, accordion and reveal primitives. It is a local tarball dependency rather than an app-owned component source.
