import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';

/**
 * Sinaliza que uma navegação está em andamento — todas as rotas são
 * `loadComponent`, então trocar de aba baixa um chunk e até aqui não havia
 * indicador nenhum: a tela anterior simplesmente congelava.
 *
 * Fica em `core/layout` (e não dentro do app-shell) porque o shell só existe nas
 * rotas autenticadas; assim login/registro também podem consumir.
 *
 * Trata todos os desfechos de navegação, não só o feliz: apenas
 * `NavigationStart`/`NavigationEnd` deixaria o indicador preso para sempre
 * quando um guard cancela — e este app tem `authGuard`, `guestGuard` e
 * `adminGuard` em uso.
 */
@Injectable({ providedIn: 'root' })
export class NavegacaoService {
  private readonly router = inject(Router);
  private readonly navegandoSignal = signal(false);

  readonly navegando = this.navegandoSignal.asReadonly();

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((evento) => {
      if (evento instanceof NavigationStart) {
        this.navegandoSignal.set(true);
        return;
      }

      if (
        evento instanceof NavigationEnd ||
        evento instanceof NavigationCancel ||
        evento instanceof NavigationError ||
        evento instanceof NavigationSkipped
      ) {
        this.navegandoSignal.set(false);
      }
    });
  }
}
