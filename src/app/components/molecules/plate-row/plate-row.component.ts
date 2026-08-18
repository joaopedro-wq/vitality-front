import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideTrash2 } from '@lucide/angular';

import { FoodIllustrationComponent } from '../../atoms/food-illustration/food-illustration.component';
import { SomenteNumeroDirective } from '../../directives/somente-numero.directive';
import type { DiaryMacros } from '../../../core/models/diary.model';
import { escalarMacros } from '../../utils/diary-day.util';

export interface PlateItem {
  foodId: number;
  descricao: string;
  detalheExibicao?: string | null;
  illustrationKey: string | null;
  quantity: number;
  qtdRef: number;
  macrosRef: DiaryMacros;
  porcaoBase?: number;
}

const PORCOES: readonly { rotulo: string; fator: number }[] = [
  { rotulo: 'pouco', fator: 0.6 },
  { rotulo: 'normal', fator: 1 },
  { rotulo: 'bastante', fator: 1.5 },
];

@Component({
  selector: 'vtp-plate-row',
  standalone: true,
  imports: [DecimalPipe, FoodIllustrationComponent, SomenteNumeroDirective, LucideTrash2],
  templateUrl: './plate-row.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlateRowComponent {
  readonly item = input.required<PlateItem>();

  readonly quantidadeChange = output<number>();
  readonly remover = output<void>();

  protected readonly porcoes = PORCOES;

  protected readonly macros = computed<DiaryMacros>(() => {
    const item = this.item();
    return escalarMacros(item.macrosRef, item.qtdRef, item.quantity);
  });

  protected readonly fatorAtual = computed(() => {
    const { porcaoBase, quantity } = this.item();
    if (!porcaoBase || porcaoBase <= 0) return null;
    return quantity / porcaoBase;
  });

  protected ativo(fator: number): boolean {
    const atual = this.fatorAtual();
    return atual !== null && Math.abs(atual - fator) < 0.005;
  }

  protected aplicarPorcao(fator: number): void {
    const base = this.item().porcaoBase;
    if (!base) return;
    this.quantidadeChange.emit(base * fator);
  }

  protected digitar(valor: string): void {
    const numero = Number(valor.replace(',', '.'));
    if (!Number.isFinite(numero) || numero <= 0) return;
    this.quantidadeChange.emit(numero);
  }
}
