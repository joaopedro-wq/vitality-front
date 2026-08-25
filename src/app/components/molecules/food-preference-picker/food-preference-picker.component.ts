import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideSearch, LucideX } from '@lucide/angular';
import { Subject, takeUntil } from 'rxjs';

import { AlimentoService } from '../../../services/alimento.service';
import type { Alimento } from '../../../core/models/alimento.model';

@Component({
  selector: 'vtp-food-preference-picker',
  standalone: true,
  imports: [LucideSearch, LucideX, TranslocoPipe],
  templateUrl: './food-preference-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodPreferencePickerComponent implements OnInit, OnDestroy {
  private readonly foodsService = inject(AlimentoService);

  private readonly destruido = new Subject<void>();

  readonly selecionadosIniciais = input.required<Alimento[]>();

  readonly bloqueados = input<number[]>([]);
  readonly limiteSelecao = input<number | null>(null);
  readonly label = input('');
  readonly selecaoChange = output<Alimento[]>();

  protected readonly busca = signal('');
  protected readonly resultados = signal<Alimento[]>([]);
  protected readonly selecionados = signal<Alimento[]>([]);

  ngOnInit(): void {
    this.selecionados.set(this.selecionadosIniciais());
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected buscar(valor: string): void {
    const termo = valor.trim();
    this.busca.set(valor);
    if (termo.length < 2) {
      this.resultados.set([]);
      return;
    }
    this.foodsService
      .list({ search: termo, page: 1 })
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: (page) =>
          this.resultados.set(
            page.data
              .filter((food) => !this.isSelecionado(food.id) && !this.isBloqueado(food.id))
              .slice(0, 6),
          ),
        error: () => this.resultados.set([]),
      });
  }

  protected adicionar(food: Alimento): void {
    const limiteAtingido =
      this.limiteSelecao() !== null && this.selecionados().length >= this.limiteSelecao()!;
    if (!limiteAtingido && !this.isSelecionado(food.id) && !this.isBloqueado(food.id)) {
      this.selecionados.update((foods) => [...foods, food]);
      this.selecaoChange.emit(this.selecionados());
    }
    this.busca.set('');
    this.resultados.set([]);
  }

  protected remover(id: number): void {
    this.selecionados.update((foods) => foods.filter((food) => food.id !== id));
    this.selecaoChange.emit(this.selecionados());
  }

  private isSelecionado(id: number): boolean {
    return this.selecionados().some((food) => food.id === id);
  }

  private isBloqueado(id: number): boolean {
    return this.bloqueados().includes(id);
  }
}
