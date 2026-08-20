import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BdButtonComponent } from 'bandeira-ui';
import { TranslocoPipe } from '@jsverse/transloco';

import type { Genero, NivelAtividade, Objetivo } from '../../../core/models/user.model';
import { ProgressRingIconComponent } from '../../atoms/progress-ring-icon/progress-ring-icon.component';
import { AnimatedNumberComponent } from '../../atoms/animated-number/animated-number.component';
import type { MetaRevealValores } from '../meta-reveal/meta-reveal.component';

export interface MetaFichaPerfil {
  peso: number;
  altura: number;
  idade: number;
  genero: Genero;
}

export interface MetaFichaCalculo {
  tmb: number;
  nivelAtividade: NivelAtividade;
  get: number;
  objetivo: Objetivo;
}

@Component({
  selector: 'vtp-meta-ficha',
  standalone: true,
  imports: [BdButtonComponent, TranslocoPipe, ProgressRingIconComponent, AnimatedNumberComponent],
  templateUrl: './meta-ficha.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaFichaComponent {
  readonly perfil = input.required<MetaFichaPerfil>();
  readonly calculo = input.required<MetaFichaCalculo>();
  readonly valores = input.required<MetaRevealValores>();

  readonly irParaPainel = output<void>();
  readonly refazer = output<void>();

  protected delay(index: number): string {
    return `${(index * 0.08).toFixed(2)}s`;
  }
}
