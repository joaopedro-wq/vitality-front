import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideArrowRight } from '@lucide/angular';
import { forkJoin } from 'rxjs';

import type { SugestaoRecomendacao } from '../../../components/utils/recomendacao-calc.util';
import { MacroSummaryComponent } from '../../../components/molecules/macro-summary/macro-summary.component';
import { StepTrackComponent, type StepTrackItem } from '../../../components/molecules/step-track/step-track.component';
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

/**
 * "Quiz Guiado" — orquestrador puro. Cada passo é um componente com a
 * própria lógica (form, validação, chamada de serviço); este componente só
 * guarda em que passo o usuário está, a sugestão calculada (compartilhada
 * entre os passos 3/4 e o painel) e navega entre eles.
 *
 * Navegação em "trilha numerada" (2026-08-13, sétima passada) — escolhida
 * entre 5 conceitos comparados (artefato), cada um baseado num padrão de UX
 * já conhecido. Essa é a mais próxima do que usuário já viu em qualquer
 * formulário multi-etapa (GOV.UK step-by-step, checkout da Stripe): bolinha
 * numerada vira check quando concluída, linha vertical conectando os passos.
 * A trilha em si virou `StepTrackComponent`
 * (`components/molecules/step-track/`) — presentation-only, sem nada de
 * Metas — pra dar pra reaproveitar em qualquer outro fluxo multi-passo do
 * produto (Dietas, Diário, etc.) sem duplicar a UI de novo.
 */
@Component({
  selector: 'vtp-metas-page',
  standalone: true,
  imports: [
    BdButtonComponent,
    LucideArrowRight,
    MacroSummaryComponent,
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
  private readonly router = inject(Router);

  protected readonly passos = PASSOS;
  protected readonly fase = signal<FaseCarregamento>('carregando');
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

  irPara(passo: number): void {
    // bd-steps (clickable) só deixa voltar pra etapas já concluídas — nunca pula pra frente.
    if (passo <= this.passo()) this.passo.set(passo);
  }

  onSugestaoCalculada(sugestao: SugestaoRecomendacao): void {
    this.sugestao.set(sugestao);
    this.passo.set(2);
  }

  irParaDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
