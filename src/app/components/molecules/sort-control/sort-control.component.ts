import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideArrowDown, LucideArrowUp, LucideChevronDown } from '@lucide/angular';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/i18n/language.service';

export interface SortOption<T extends string = string> {
  readonly field: T;
  readonly label: string;
}

@Component({
  selector: 'vtp-sort-control',
  standalone: true,
  imports: [LucideArrowDown, LucideArrowUp, LucideChevronDown, TranslocoPipe],
  templateUrl: './sort-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortControlComponent<T extends string = string> {
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  readonly opcoes = input.required<readonly SortOption<T>[]>();
  readonly campo = input.required<T>();
  readonly ordem = input.required<1 | -1>();
  readonly direcaoLabel = input.required<string>();
  readonly rotulo = input('Ordenar');

  readonly campoChange = output<T>();
  readonly ordemChange = output<1 | -1>();

  protected readonly aberto = signal(false);
  protected readonly rotuloResolvido = computed(() => {
    this.language.locale();
    return this.rotulo() === 'Ordenar' ? this.transloco.translate('ui.sort.sort') : this.rotulo();
  });
  protected readonly direcaoResolvida = computed(() => {
    this.language.locale();
    const value = this.direcaoLabel();
    if (value === 'Ascendente') return this.transloco.translate('ui.sort.ascending');
    if (value === 'Descendente') return this.transloco.translate('ui.sort.descending');
    return value;
  });

  protected readonly opcaoAtualLabel = computed(() =>
    this.resolveOptionLabel(
      this.opcoes().find((opcao) => opcao.field === this.campo())?.label ?? '',
    ),
  );

  protected resolveOptionLabel(value: string): string {
    this.language.locale();
    const keys: Record<string, string> = {
      Nome: 'ui.sort.name',
      Calorias: 'ui.sort.calories',
      Proteína: 'ui.sort.protein',
      Carboidratos: 'ui.sort.carbs',
      Gorduras: 'ui.sort.fat',
    };
    return keys[value] ? this.transloco.translate(keys[value]) : value;
  }

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
