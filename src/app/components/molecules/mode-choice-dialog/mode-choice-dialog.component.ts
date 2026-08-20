import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideListChecks, LucideSparkles, LucideX } from '@lucide/angular';

export type ModoGeracaoPlano = 'ia' | 'manual';

/**
 * Modal de escolha entre gerar o plano por IA ou montá-lo manualmente —
 * mesmo esqueleto de overlay do `ConfirmDialogComponent` (backdrop, Esc,
 * `animate-reveal`), com dois cards grandes clicáveis no lugar dos botões de
 * confirmação. Escolher já emite `escolhido`, sem passo extra.
 *
 * Visual "Linguagem RPG" (escolhido entre 5 conceitos comparados em
 * artefato, 2026-08-20): anel cônico atrás do ícone + glow em hover/foco,
 * estendendo o vocabulário já usado no `MetaRevealComponent` e no botão
 * final do `StepFooterComponent` (`.round-next.done`) pro modal de Dietas.
 */
@Component({
  selector: 'vtp-mode-choice-dialog',
  standalone: true,
  imports: [BdButtonComponent, TranslocoPipe, LucideListChecks, LucideSparkles, LucideX],
  templateUrl: './mode-choice-dialog.component.html',
  styleUrl: './mode-choice-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeChoiceDialogComponent {
  readonly aberto = input(false);

  readonly escolhido = output<ModoGeracaoPlano>();
  readonly cancelado = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.aberto()) this.cancelar();
  }

  protected escolher(modo: ModoGeracaoPlano): void {
    this.escolhido.emit(modo);
  }

  protected cancelar(): void {
    this.cancelado.emit();
  }
}
