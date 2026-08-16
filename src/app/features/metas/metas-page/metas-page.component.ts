import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideArrowRight } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import {
  calcularSugestaoRecomendacao,
  type SugestaoRecomendacao,
} from '../../../components/utils/recomendacao-calc.util';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { MetaRevealComponent } from '../../../components/molecules/meta-reveal/meta-reveal.component';
import {
  StepTrackComponent,
  type StepTrackItem,
} from '../../../components/molecules/step-track/step-track.component';
import { RecomendacaoService } from '../../../services/recomendacao.service';
import { MetaService } from '../../../services/meta.service';
import { AtividadeStepComponent } from './steps/atividade-step/atividade-step.component';
import { PerfilStepComponent } from './steps/perfil-step/perfil-step.component';
import { RevisarStepComponent } from './steps/revisar-step/revisar-step.component';
import { SugestaoStepComponent } from './steps/sugestao-step/sugestao-step.component';

type FaseCarregamento = 'carregando' | 'quiz' | 'configurado';

const PASSOS: StepTrackItem[] = [
  { titulo: 'Seu perfil', descricao: 'Peso, altura, idade e gênero' },
  { titulo: 'Atividade', descricao: 'Nível de atividade e objetivo' },
  { titulo: 'Sugestão', descricao: 'Calculada a partir do perfil' },
  { titulo: 'Confirmar', descricao: 'Revisar e salvar' },
];

@Component({
  selector: 'vtp-metas-page',
  standalone: true,
  imports: [
    BdButtonComponent,
    LucideArrowRight,
    LoadingStateComponent,
    MetaRevealComponent,
    StepTrackComponent,
    PerfilStepComponent,
    AtividadeStepComponent,
    SugestaoStepComponent,
    RevisarStepComponent,
  ],
  templateUrl: './metas-page.component.html',
  styleUrl: './metas-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetasPageComponent {
  private readonly recomendacaoService = inject(RecomendacaoService);
  private readonly metaService = inject(MetaService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  protected readonly passos = PASSOS;
  protected readonly fase = signal<FaseCarregamento>('carregando');
  // Gateado: o template inteiro pendura no signal de exibição, nunca no cru —
  // senão o conteúdo apareceria por baixo do loader na permanência mínima.
  protected readonly carregandoVisivel = gateCarregamento(
    computed(() => this.fase() === 'carregando'),
  );
  protected readonly passo = signal(0);
  protected readonly sugestao = signal<SugestaoRecomendacao | null>(null);

  constructor() {
    forkJoin([this.metaService.list(), this.recomendacaoService.list()]).subscribe({
      next: ([metas, recomendacoes]) => {
        const vigente = metas.find((m) => m.data === null) ?? metas[0];
        const atual = recomendacoes[0];

        if (vigente && atual) {
          this.sugestao.set({
            tmb: atual.tmb,
            get: atual.get,
            caloria: vigente.meta_calorias,
            proteina: vigente.meta_proteinas,
            carbo: vigente.meta_carboidratos,
            gordura: vigente.meta_gorduras,
          });
          this.fase.set('configurado');
        } else {
          this.fase.set('quiz');
        }
      },
      error: () => this.fase.set('quiz'),
    });
  }

  refazer(): void {
    this.fase.set('quiz');
    this.passo.set(0);
    this.sugestao.set(null);
  }

  /** Navegação livre pela trilha — clicar em qualquer passo pula direto pra ele, não só
   * voltar/avançar sequencial. Os passos 2/3 (Sugestão/Confirmar) dependem de `sugestao()`
   * calculada; se o usuário ainda não passou pela Atividade, tenta calcular na hora a partir do
   * que já está salvo no perfil — só bloqueia se realmente faltar dado (perfil incompleto). */
  irPara(passo: number): void {
    if (passo === this.passo()) return;

    if ((passo === 2 || passo === 3) && !this.sugestao()) {
      const calculada = calcularSugestaoRecomendacao(this.authService.currentUser());
      if (!calculada) {
        this.toastr.error('Preencha seu perfil e atividade antes de pular pra esse passo.');
        return;
      }
      this.sugestao.set(calculada);
    }

    this.passo.set(passo);
  }

  onSugestaoCalculada(sugestao: SugestaoRecomendacao): void {
    this.sugestao.set(sugestao);
    this.passo.set(2);
  }

  irParaDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
