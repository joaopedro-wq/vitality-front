import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'vtp-back-button',
  standalone: true,
  imports: [LucideArrowLeft],
  templateUrl: './back-button.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly rotulo = input('Voltar');
  readonly fallbackRota = input('/dashboard');

  protected voltar(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl(this.fallbackRota());
    }
  }
}
