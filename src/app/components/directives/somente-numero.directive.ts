import { Directive, HostListener } from '@angular/core';

const TECLAS_PERMITIDAS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/**
 * Bloqueia letra e símbolo em `<input type="number">` — o `type="number"`
 * nativo não segura tudo sozinho: `e`/`E` (notação científica), `+`/`-` e
 * letra digitada via teclado de Safari/Android/IME ainda passam. Presentation
 * -only, sem nada de feature — usar em qualquer campo numérico do sistema.
 *
 * @example
 * ```html
 * <input type="number" formControlName="peso" vtpSomenteNumero />
 * ```
 */
@Directive({
  selector: 'input[vtpSomenteNumero]',
  standalone: true,
})
export class SomenteNumeroDirective {
  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (TECLAS_PERMITIDAS.has(event.key)) return;
    if (/^[0-9]$/.test(event.key)) return;
    if (event.key === '.' || event.key === ',') return;
    event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  protected onPaste(event: ClipboardEvent): void {
    const texto = event.clipboardData?.getData('text') ?? '';
    if (!/^-?[0-9]*[.,]?[0-9]*$/.test(texto)) {
      event.preventDefault();
    }
  }
}
