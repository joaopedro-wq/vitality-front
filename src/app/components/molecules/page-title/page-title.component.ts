import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/i18n/language.service';

export type PageTitleVariant = 'pagina' | 'autenticacao';

@Component({
  selector: 'vtp-page-title',
  standalone: true,
  templateUrl: './page-title.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTitleComponent {
  private readonly language = inject(LanguageService);
  private readonly transloco = inject(TranslocoService);
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | undefined>(undefined);
  readonly contexto = input<string | undefined>(undefined);
  readonly variante = input<PageTitleVariant>('pagina');
  readonly centralizado = input(false, { transform: booleanAttribute });

  private readonly keyByText: Record<string, string> = {
    Dashboard: 'pageTitle.dashboard',
    Biblioteca: 'pageTitle.library',
    'Meta atual': 'goalLabels.current',
    'Minha conta': 'profileLabels.account',
    Alimentos: 'pageTitle.foods',
    'Diário alimentar': 'pageTitle.diary',
    'Perfil e preferências': 'pageTitle.profile',
    'Catálogo de alimentos': 'pageTitle.foodCatalog',
    'Primeiro, vamos definir sua meta': 'pageTitle.dietsGoal',
    'Uma rotina que cabe no seu dia': 'pageTitle.dietsRoutine',
    'Como é o seu dia?': 'pageTitle.dietForm',
    'Monte o seu prato': 'pageTitle.buildPlate',
    'Sua meta diária está pronta': 'pageTitle.goalReady',
    Desenvolvimento: 'pageTitle.development',
    'Prévia do plano': 'pageTitle.planPreview',
    'Fase 6 do plano ainda não implementada.': 'pageTitle.dashboardSubtitle',
    'Encontre itens do catálogo TACO e guarde os que você usa com frequência.':
      'pageTitle.foodsSubtitle',
    'Registre suas refeições e acompanhe a composição do seu dia.': 'pageTitle.diarySubtitle',
    'Atualize seus dados em etapas curtas. Cada avanço é salvo para não perder seu progresso.':
      'pageTitle.profileSubtitle',
    'Itens globais usados por toda a plataforma.': 'pageTitle.foodCatalogSubtitle',
    'Seu plano é montado a partir das calorias e macros que você confirmou para o seu objetivo.':
      'pageTitle.dietsGoalSubtitle',
    'Sugestões flexíveis baseadas na sua meta atual — você sempre revisa antes de registrar.':
      'pageTitle.dietsRoutineSubtitle',
    'Vale hoje pro painel e pro diário. Mudou a rotina? Refaça o quiz quando quiser.':
      'pageTitle.goalReadySubtitle',
  };

  protected readonly tituloResolvido = computed(() => this.resolve(this.titulo()));
  protected readonly subtituloResolvido = computed(() => {
    const value = this.subtitulo();
    return value ? this.resolve(value) : undefined;
  });
  protected readonly contextoResolvido = computed(() => {
    const value = this.contexto();
    return value ? this.resolve(value) : undefined;
  });

  private resolve(value: string): string {
    this.language.locale();
    const key = this.keyByText[value];
    return key ? this.transloco.translate(key) : value;
  }
}
