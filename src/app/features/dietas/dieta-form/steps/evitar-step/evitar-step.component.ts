import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import { AlimentoService } from '../../../../../services/alimento.service';
import type { Alimento } from '../../../../../core/models/alimento.model';

@Component({
  selector: 'vtp-evitar-step',
  standalone: true,
  imports: [StepFooterComponent, TranslocoPipe],
  templateUrl: './evitar-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvitarStepComponent implements OnInit {
  private readonly foodsService = inject(AlimentoService);

  readonly excluidosIniciais = input.required<Alimento[]>();
  readonly voltar = output<void>();
  readonly concluido = output<Alimento[]>();

  protected readonly busca = signal('');
  protected readonly resultados = signal<Alimento[]>([]);
  protected readonly excluidos = signal<Alimento[]>([]);

  ngOnInit(): void {
    this.excluidos.set(this.excluidosIniciais());
  }

  protected buscar(valor: string): void {
    const termo = valor.trim();
    this.busca.set(valor);
    if (termo.length < 2) {
      this.resultados.set([]);
      return;
    }
    this.foodsService.list({ search: termo, page: 1 }).subscribe({
      next: (page) =>
        this.resultados.set(page.data.filter((food) => !this.isExcluido(food.id)).slice(0, 6)),
      error: () => this.resultados.set([]),
    });
  }

  protected adicionar(food: Alimento): void {
    if (!this.isExcluido(food.id)) this.excluidos.update((foods) => [...foods, food]);
    this.busca.set('');
    this.resultados.set([]);
  }

  protected remover(id: number): void {
    this.excluidos.update((foods) => foods.filter((food) => food.id !== id));
  }

  protected avancar(): void {
    this.concluido.emit(this.excluidos());
  }

  private isExcluido(id: number): boolean {
    return this.excluidos().some((food) => food.id === id);
  }
}
