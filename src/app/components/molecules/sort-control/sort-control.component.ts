import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideArrowDown, LucideArrowUp, LucideChevronDown } from '@lucide/angular';

export interface SortOption<T extends string = string> {
  readonly field: T;
  readonly label: string;
}

@Component({
  selector: 'vtp-sort-control',
  standalone: true,
  imports: [LucideArrowDown, LucideArrowUp, LucideChevronDown],
  templateUrl: './sort-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortControlComponent<T extends string = string> {
  readonly opcoes = input.required<readonly SortOption<T>[]>();
  readonly campo = input.required<T>();
  readonly ordem = input.required<1 | -1>();
  readonly direcaoLabel = input.required<string>();
  readonly rotulo = input('Ordenar');

  readonly campoChange = output<T>();
  readonly ordemChange = output<1 | -1>();

  protected readonly aberto = signal(false);

  protected readonly opcaoAtualLabel = computed(
    () => this.opcoes().find((opcao) => opcao.field === this.campo())?.label ?? '',
  );

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.aberto.set(false);
  }

  protected toggleAberto(): void {
    this.aberto.update((aberto) => !aberto);
  }

  protected fechar(): void {
    this.aberto.set(false);
  }

  protected selecionar(campo: T): void {
    this.campoChange.emit(campo);
    this.aberto.set(false);
  }

  protected inverter(): void {
    this.ordemChange.emit(this.ordem() === 1 ? -1 : 1);
  }
}
