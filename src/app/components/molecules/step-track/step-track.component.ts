import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LucideCheck } from '@lucide/angular';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/i18n/language.service';

export interface StepTrackItem {
  titulo: string;
  descricao?: string;
}

export type StepTrackOrientation = 'vertical' | 'horizontal';

@Component({
  selector: 'vtp-step-track',
  standalone: true,
  imports: [LucideCheck],
  templateUrl: './step-track.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepTrackComponent {
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  readonly steps = input.required<StepTrackItem[]>();
  readonly ativo = input.required<number>();
  readonly label = input('Etapas');
  readonly orientacao = input<StepTrackOrientation>('vertical');

  readonly stepClick = output<number>();

  protected readonly stepsResolvidos = computed(() => {
    this.language.locale();
    return this.steps().map((step) => ({
      ...step,
      titulo: this.resolve(step.titulo),
      descricao: step.descricao ? this.resolve(step.descricao) : step.descricao,
    }));
  });

  protected readonly labelResolvido = computed(() => {
    this.language.locale();
    const key: Record<string, string> = {
      'Etapas do perfil': 'profileLabels.steps',
      'Etapas da configuração de metas': 'goalLabels.steps',
      Etapas: 'common.steps',
    };
    return key[this.label()] ? this.transloco.translate(key[this.label()]) : this.label();
  });

  private resolve(value: string): string {
    const keys: Record<string, string> = {
      Identidade: 'profileLabels.identity',
      'Dados pessoais e foto': 'profileLabels.identityDescription',
      Corpo: 'profileLabels.body',
      'Peso e altura': 'profileLabels.bodyDescription',
      Rotina: 'profileLabels.routine',
      'Atividade e objetivo': 'profileLabels.routineDescription',
      'Seu perfil': 'goalLabels.profileStep',
      'Peso, altura, idade e gênero': 'goalLabels.profileStepDescription',
      Atividade: 'goalLabels.activityStep',
      'Nível de atividade e objetivo': 'goalLabels.activityStepDescription',
      Sugestão: 'goalLabels.suggestionStep',
      'Calculada a partir do perfil': 'goalLabels.suggestionStepDescription',
      Confirmar: 'goalLabels.confirmStep',
      'Revisar e salvar': 'goalLabels.confirmStepDescription',
    };
    return keys[value] ? this.transloco.translate(keys[value]) : value;
  }
}
