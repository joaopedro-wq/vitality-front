import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideArrowLeft, LucideArrowRight, LucideLoaderCircle, LucideSave } from '@lucide/angular';

@Component({
  selector: 'vtp-step-footer',
  standalone: true,
  imports: [LucideArrowLeft, LucideArrowRight, LucideSave, LucideLoaderCircle],
  templateUrl: './step-footer.component.html',
  styleUrl: './step-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepFooterComponent {
  readonly mostrarVoltar = input(true);
  readonly carregando = input(false);
  readonly ultimo = input(false);
  readonly desabilitado = input(false);

  readonly voltar = output<void>();
  readonly avancar = output<void>();
}
