import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { FoodPreferencePickerComponent } from '../../../../../components/molecules/food-preference-picker/food-preference-picker.component';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import type { Alimento } from '../../../../../core/models/alimento.model';

@Component({
  selector: 'vtp-preferencias-step',
  standalone: true,
  imports: [StepFooterComponent, FoodPreferencePickerComponent, TranslocoPipe],
  templateUrl: './preferencias-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenciasStepComponent implements OnInit {
  readonly excluidosIniciais = input.required<Alimento[]>();
  readonly incluidosIniciais = input.required<Alimento[]>();
  readonly voltar = output<void>();
  readonly concluido = output<{ evitados: Alimento[]; incluidos: Alimento[] }>();

  protected readonly evitados = signal<Alimento[]>([]);
  protected readonly incluidos = signal<Alimento[]>([]);

  protected readonly evitadosIds = computed(() => this.evitados().map((food) => food.id));
  protected readonly incluidosIds = computed(() => this.incluidos().map((food) => food.id));

  ngOnInit(): void {
    this.evitados.set(this.excluidosIniciais());
    this.incluidos.set(this.incluidosIniciais());
  }

  protected avancar(): void {
    this.concluido.emit({ evitados: this.evitados(), incluidos: this.incluidos() });
  }
}
