import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BdCheckboxComponent } from 'bandeira-ui';

import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

@Component({
  selector: 'vtp-facet-checkbox-list',
  standalone: true,
  imports: [BdCheckboxComponent, PlateLoaderComponent],
  templateUrl: './facet-checkbox-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacetCheckboxListComponent {
  readonly label = input('');
  readonly options = input.required<FacetOption[]>();
  readonly selected = input.required<string[]>();
  readonly loading = input(false);
  readonly emptyLabel = input('Nenhuma opção disponível');

  readonly selectedChange = output<string[]>();

  protected isSelected(value: string): boolean {
    return this.selected().includes(value);
  }

  protected toggle(value: string, checked: boolean): void {
    const atual = this.selected();
    const proximo = checked ? [...atual, value] : atual.filter((v) => v !== value);
    this.selectedChange.emit(proximo);
  }
}
