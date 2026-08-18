import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { LucideEllipsisVertical } from '@lucide/angular';

@Component({
  selector: 'vtp-overflow-menu',
  standalone: true,
  imports: [LucideEllipsisVertical],
  templateUrl: './overflow-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverflowMenuComponent {
  readonly aberto = input(false, { transform: booleanAttribute });
  readonly rotulo = input('Mais ações');

  readonly alternar = output<void>();
  readonly fechar = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);

  @HostListener('document:keydown.escape')
  protected aoEscapar(): void {
    if (this.aberto()) this.fechar.emit();
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(event: MouseEvent): void {
    if (this.aberto() && !this.host.nativeElement.contains(event.target as Node)) {
      this.fechar.emit();
    }
  }
}
