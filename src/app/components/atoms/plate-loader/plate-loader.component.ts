import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TamanhoPrato = 'xs' | 'sm' | 'md' | 'lg';

const TAMANHOS: Record<TamanhoPrato, number> = { xs: 20, sm: 48, md: 76, lg: 164 };

// O `clipPath` do SVG precisa de um id único por instância — dois pratos na
// mesma tela com o mesmo id fariam o segundo recortar pelo primeiro.
let instancias = 0;

/**
 * "Prato Servindo" — o único indicador de espera do sistema, em quatro escalas.
 *
 * Em `xs` (20px, dentro de botão) a onda é ilegível, então degrada de propósito
 * para um disco que enche. O vapor só aparece em `md`/`lg`, onde há pixel pra
 * ele existir.
 *
 * Pinta tudo com `currentColor` em vez de cravar o token. A cor padrão é
 * `--bd-primary`, mas dentro de superfície primary (o `.round-next` do
 * `vtp-step-footer`, um `bdButton` cheio) isso ficaria primary sobre primary —
 * invisível. Nesses casos passe `cor="herdada"`, que devolve a decisão de cor
 * ao container. Não dá pra resolver só com herança de CSS: uma declaração de
 * `color` no `:host` sempre vence o valor herdado do pai.
 */
@Component({
  selector: 'vtp-plate-loader',
  standalone: true,
  templateUrl: './plate-loader.component.html',
  styleUrl: './plate-loader.component.scss',
  host: {
    class: 'inline-flex shrink-0',
    // Sem rótulo o prato é decoração: quem anuncia é o container (`vtp-loading-state`)
    // ou o próprio botão (`aria-busy` do bdButton). Evita anúncio duplicado.
    '[attr.role]': 'rotulo() ? "status" : null',
    '[attr.aria-label]': 'rotulo() ?? null',
    '[attr.aria-hidden]': 'rotulo() ? null : "true"',
    '[class.cor-herdada]': "cor() === 'herdada'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlateLoaderComponent {
  readonly tamanho = input<TamanhoPrato>('md');
  readonly rotulo = input<string | undefined>(undefined);
  /** `herdada` = usa a cor do container (obrigatório sobre fundo primary). */
  readonly cor = input<'primary' | 'herdada'>('primary');

  protected readonly px = computed(() => TAMANHOS[this.tamanho()]);
  protected readonly comVapor = computed(() => this.tamanho() === 'md' || this.tamanho() === 'lg');
  protected readonly clipId = `vtp-prato-${instancias++}`;
}
