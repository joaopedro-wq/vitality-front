import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  input,
  output,
  signal,
} from '@angular/core';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import type { MealPlanStyle } from '../../../../../core/models/meal-plan.model';

/** Passo 2 do quiz — qual estilo (rápido/caseiro/econômico) ajuda mais na rotina. */
@Component({
  selector: 'vtp-estilo-step',
  standalone: true,
  imports: [StepFooterComponent],
  templateUrl: './estilo-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstiloStepComponent implements OnInit {
  readonly valorInicial = input.required<MealPlanStyle>();
  readonly voltar = output<void>();
  readonly concluido = output<MealPlanStyle>();

  protected readonly opcoes: { value: MealPlanStyle; label: string }[] = [
    { value: 'rapido', label: 'Rápido' },
    { value: 'caseiro', label: 'Caseiro' },
    { value: 'economico', label: 'Econômico' },
  ];

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
