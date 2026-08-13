import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BdButtonComponent, BdStepsComponent, type BdStep } from 'bandeira-ui';
import { forkJoin } from 'rxjs';

import type { SugestaoRecomendacao } from '../../../shared/utils/recomendacao-calc.util';
import { RecomendacaoService } from '../../recomendacao/data/recomendacao.service';
import { MetaService } from '../data/meta.service';
import { MacroSummaryComponent } from './macro-summary/macro-summary.component';
import { AtividadeStepComponent } from './steps/atividade-step/atividade-step.component';
import { PerfilStepComponent } from './steps/perfil-step/perfil-step.component';
import { RevisarStepComponent } from './steps/revisar-step/revisar-step.component';
import { SugestaoStepComponent } from './steps/sugestao-step/sugestao-step.component';

type FaseCarregamento = 'carregando' | 'quiz' | 'configurado';

const PASSOS: BdStep[] = [
  { label: 'Seu perfil', hint: 'Peso, altura, idade e gênero' },
  { label: 'Atividade', hint: 'Nível de atividade e objetivo' },
  { label: 'Sugestão', hint: 'Calculada a partir do perfil' },
  { label: 'Confirmar', hint: 'Revisar e salvar' },
];

/**
 * "Quiz Guiado" — orquestrador puro. Cada passo é um componente com a
 * própria lógica (form, validação, chamada de serviço); este componente só
 * guarda em que passo o usuário está, a sugestão calculada (compartilhada
 * entre os passos 3/4 e o painel) e navega entre eles.
 */
@Component({
  selector: 'vtp-metas-page',
  standalone: true,
  imports: [
    BdButtonComponent,
    BdStepsComponent,
    MacroSummaryComponent,
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
