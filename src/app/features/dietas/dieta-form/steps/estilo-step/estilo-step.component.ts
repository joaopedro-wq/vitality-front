import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import { LanguageService } from '../../../../../core/i18n/language.service';
import type { MealPlanStyle } from '../../../../../core/models/meal-plan.model';

@Component({
  selector: 'vtp-estilo-step',
  standalone: true,
  imports: [StepFooterComponent, TranslocoPipe],
  templateUrl: './estilo-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstiloStepComponent implements OnInit {
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);

  readonly valorInicial = input.required<MealPlanStyle>();
  readonly voltar = output<void>();
  readonly concluido = output<MealPlanStyle>();

  protected readonly opcoes = computed<{ value: MealPlanStyle; label: string; description: string }[]>(() => {
    this.language.locale();

    return (['rapido', 'caseiro', 'economico'] as const).map((value) => ({
      value,
      label: this.transloco.translate(`dietPlan.styleLabels.${value}`),
      description: this.transloco.translate(`dietPlan.steps.style.descriptions.${value}`),
    }));
  });

  protected readonly selecionado = signal<MealPlanStyle>('rapido');

  ngOnInit(): void {
    this.selecionado.set(this.valorInicial());
  }

  protected selecionar(valor: MealPlanStyle): void {
    this.selecionado.set(valor);
  }

  protected avancar(): void {
    this.concluido.emit(this.selecionado());
  }
}
