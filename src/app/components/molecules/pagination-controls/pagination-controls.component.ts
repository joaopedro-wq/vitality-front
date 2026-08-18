import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

import { criarItensPaginacao } from '../../utils/pagination.util';

@Component({
  selector: 'vtp-pagination-controls',
  standalone: true,
  imports: [LucideChevronLeft, LucideChevronRight],
  templateUrl: './pagination-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationControlsComponent {
  readonly pagina = input.required<number>();
  readonly totalRegistros = input.required<number>();
  readonly tamanhoPagina = input(20);
  readonly carregando = input(false);

  readonly paginaChange = output<number>();

  protected readonly totalPaginas = computed(() =>
    Math.ceil(this.totalRegistros() / this.tamanhoPagina()),
  );
  protected readonly intervaloResultados = computed(() => {
    const total = this.totalRegistros();
    const inicio = total ? (this.pagina() - 1) * this.tamanhoPagina() + 1 : 0;
    return { inicio, fim: Math.min(this.pagina() * this.tamanhoPagina(), total) };
  });
  protected readonly itensPaginacao = computed(() =>
    criarItensPaginacao(this.pagina(), this.totalPaginas()),
  );

  protected irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas() || pagina === this.pagina() || this.carregando())
      return;
    this.paginaChange.emit(pagina);
  }
}
