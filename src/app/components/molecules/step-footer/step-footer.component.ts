import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LucideArrowLeft, LucideArrowRight, LucideSave } from '@lucide/angular';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/i18n/language.service';

import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';

@Component({
  selector: 'vtp-step-footer',
  standalone: true,
  imports: [LucideArrowLeft, LucideArrowRight, LucideSave, PlateLoaderComponent],
  templateUrl: './step-footer.component.html',
  styleUrl: './step-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepFooterComponent {
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  readonly mostrarVoltar = input(true);
  readonly carregando = input(false);
  readonly ultimo = input(false);
  readonly desabilitado = input(false);

  readonly voltar = output<void>();
  readonly avancar = output<void>();
  protected readonly backLabel = computed(() => { this.language.locale(); return this.transloco.translate('common.actions.back'); });
  protected readonly saveLabel = computed(() => { this.language.locale(); return this.transloco.translate('common.actions.save'); });
  protected readonly continueLabel = computed(() => this.language.locale() === 'en-US' ? 'Continue' : 'Continuar');
}
