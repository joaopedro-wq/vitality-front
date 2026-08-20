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
import { Subject, takeUntil } from 'rxjs';

import { AlimentoService } from '../../../services/alimento.service';
import type { Alimento } from '../../../core/models/alimento.model';

/**
 * Busca+chip genérico pra selecionar uma lista de alimentos (sem regra de negócio
 * de "evitar"/"incluir" — quem usa decide o que a seleção significa). Nasceu
 * dentro do quiz de plano por IA (`EvitarStepComponent`) e foi extraído pra
 * reaproveitar nas duas seções do passo "Preferências" (evitar / incluir sempre).
 */
@Component({
  selector: 'vtp-food-preference-picker',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './food-preference-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodPreferencePickerComponent implements OnInit, OnDestroy {
  private readonly foodsService = inject(AlimentoService);
  /** Regra do sistema: toda subscription de chamada à API é encerrada ao sair do
   * componente — `takeUntil(this.destruido)` em cada `.subscribe()`. */
  private readonly destruido = new Subject<void>();

  readonly selecionadosIniciais = input.required<Alimento[]>();
  /** Ids a esconder da busca — a seleção da OUTRA seção, pra evitar que o mesmo
   * alimento seja escolhido em "evitar" e "incluir sempre" ao mesmo tempo. */
  readonly bloqueados = input<number[]>([]);
  /** Rótulo acessível do campo de busca (ex. "Evitar"/"Incluir sempre") — as
   * duas instâncias no mesmo passo têm placeholder idêntico, sem isso um
   * leitor de tela não distingue qual campo é qual. */
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
    if (!this.isSelecionado(food.id) && !this.isBloqueado(food.id)) {
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
