import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  input,
  output,
  signal,
} from '@angular/core';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';

@Component({
  selector: 'vtp-refeicoes-step',
  standalone: true,
  imports: [StepFooterComponent],
  templateUrl: './refeicoes-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefeicoesStepComponent implements OnInit {
  readonly valorInicial = input.required<3 | 4 | 5>();
  readonly concluido = output<3 | 4 | 5>();

  protected readonly selecionado = signal<3 | 4 | 5>(4);

  ngOnInit(): void {
    this.selecionado.set(this.valorInicial());
  }

  protected selecionar(valor: number): void {
    this.selecionado.set(valor as 3 | 4 | 5);
  }

  protected avancar(): void {
    this.concluido.emit(this.selecionado());
  }
}
