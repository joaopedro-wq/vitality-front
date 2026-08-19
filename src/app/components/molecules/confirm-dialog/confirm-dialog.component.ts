import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideArchive, LucideShieldCheck, LucideTrash2, LucideX } from '@lucide/angular';

export type ConfirmDialogVariant = 'danger' | 'soft' | 'sheet';

@Component({
  selector: 'vtp-confirm-dialog',
  standalone: true,
  imports: [
    BdButtonComponent,
    TranslocoPipe,
    LucideArchive,
    LucideShieldCheck,
    LucideTrash2,
    LucideX,
  ],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly aberto = input(false);
  readonly variante = input<ConfirmDialogVariant>('danger');
  readonly titulo = input('Confirmar ação');
  readonly descricao = input('Essa ação não poderá ser desfeita.');
  readonly confirmarTexto = input('Confirmar');
  readonly cancelarTexto = input('Cancelar');
  readonly confirmado = output<void>();
  readonly cancelado = output<void>();

  protected readonly classePainel = computed(
    () => `confirm-dialog__panel confirm-dialog__panel--${this.variante()}`,
  );

  protected confirmar(): void {
    this.confirmado.emit();
  }

  protected cancelar(): void {
    this.cancelado.emit();
  }
}
