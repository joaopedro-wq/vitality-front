import { Injectable, NgZone, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Style, StatusBar } from '@capacitor/status-bar';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../layout/theme.service';
import { OverlayStackService } from './overlay-stack.service';
import { PlatformService } from './platform.service';

const ROTAS_RAIZ = ['/dashboard', '/login', '/'];

const CONFIRMACAO_SAIDA_MS = 2000;

@Injectable({ providedIn: 'root' })
export class NativeShellService {
  private readonly platform = inject(PlatformService);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly overlays = inject(OverlayStackService);
  private readonly theme = inject(ThemeService);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);

  private readonly listeners: PluginListenerHandle[] = [];
  private saidaConfirmadaAte = 0;
  private iniciado = false;

  constructor() {
    // Fora do `start()` porque effect() exige contexto de injeção. Só age
    // quando o app nativo já iniciou.
    effect(() => {
      const tema = this.theme.theme();
      if (!this.platform.isNative || !this.iniciado) return;

      // `Style.Dark` = conteúdo claro sobre fundo escuro.
      void StatusBar.setStyle({ style: tema === 'dark' ? Style.Dark : Style.Light }).catch(() => {
        // Alguns aparelhos não expõem a barra; não é motivo para quebrar o boot.
      });
    });
  }

  /** Chamado uma vez pelo componente raiz, depois do bootstrap do Angular. */
  start(): void {
    if (!this.platform.isNative || this.iniciado) return;
    this.iniciado = true;

    void SplashScreen.hide().catch(() => {
      // Splash já escondida (ou plugin ausente): segue o jogo.
    });

    void App.addListener('backButton', ({ canGoBack }) => {
      this.zone.run(() => this.onBackButton(canGoBack));
    }).then((listener) => this.listeners.push(listener));

    void App.addListener('appStateChange', ({ isActive }) => {
      this.zone.run(() => this.onAppStateChange(isActive));
    }).then((listener) => this.listeners.push(listener));
  }

  async stop(): Promise<void> {
    await Promise.all(this.listeners.map((listener) => listener.remove()));
    this.listeners.length = 0;
    this.iniciado = false;
  }

  private onBackButton(canGoBack: boolean): void {
    // 1. O que estiver por cima fecha primeiro.
    if (this.overlays.fecharTopo()) return;

    // 2. Fora das raízes, voltar é navegar para trás.
    const naRaiz = ROTAS_RAIZ.includes(this.router.url.split('?')[0]);
    if (canGoBack && !naRaiz) {
      window.history.back();
      return;
    }

    // 3. Na raiz, sair — mas só no segundo toque, para não fechar sem querer.
    const agora = Date.now();
    if (agora < this.saidaConfirmadaAte) {
      void App.exitApp();
      return;
    }

    this.saidaConfirmadaAte = agora + CONFIRMACAO_SAIDA_MS;
    this.toastr.info(this.transloco.translate('common.app.exitHint'));
  }

  private onAppStateChange(isActive: boolean): void {
    // Voltando do segundo plano com sessão aberta: revalida o token e atualiza
    // o usuário. Se o token tiver sido revogado, o errorInterceptor derruba.
    if (!isActive || !this.auth.isAuthenticated()) return;

    this.auth.restoreSession().subscribe();
  }
}
