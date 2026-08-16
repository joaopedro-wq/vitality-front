import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PageTitleVariant = 'pagina' | 'autenticacao';

@Component({
  selector: 'vtp-page-title',
  standalone: true,
  templateUrl: './page-title.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTitleComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | undefined>(undefined);
  readonly contexto = input<string | undefined>(undefined);
  readonly variante = input<PageTitleVariant>('pagina');
  readonly centralizado = input(false, { transform: booleanAttribute });
}
