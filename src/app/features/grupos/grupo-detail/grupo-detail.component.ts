import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { BdAvatarComponent, BdButtonComponent, BdCountUpDirective } from 'bandeira-ui';
import {
  LucideActivity,
  LucideCheckCheck,
  LucideCopy,
  LucideCrown,
  LucideHeartPulse,
  LucideLogOut,
  LucideTarget,
  LucideTrash2,
  LucideTrophy,
  LucideUsersRound,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, forkJoin, takeUntil } from 'rxjs';

import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { ConfirmDialogComponent } from '../../../components/molecules/confirm-dialog/confirm-dialog.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import {
  ViewModeToggleComponent,
  type ViewModeOption,
} from '../../../components/molecules/view-mode-toggle/view-mode-toggle.component';
import { ProgressRingIconComponent } from '../../../components/atoms/progress-ring-icon/progress-ring-icon.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { AuthService } from '../../../core/auth/auth.service';
import { LanguageService } from '../../../core/i18n/language.service';
import type { DashboardResumo } from '../../../core/models/dashboard.model';
import type { Group, GroupActivityItem, GroupRankingEntry } from '../../../core/models/group.model';
import { DashboardService } from '../../../services/dashboard.service';
import { GroupService } from '../../../services/group.service';

type ModoVisualizacao = 'ranking' | 'atividade';

@Component({
  selector: 'vtp-grupo-detail',
  standalone: true,
  imports: [
    TranslocoPipe,
    RouterLink,
    BdButtonComponent,
    BdAvatarComponent,
    BdCountUpDirective,
    LucideCheckCheck,
    LucideCopy,
    LucideCrown,
    LucideHeartPulse,
    LucideLogOut,
    LucideTarget,
    LucideTrash2,
    LucideTrophy,
    LucideUsersRound,
    BackButtonComponent,
    ConfirmDialogComponent,
    LoadingStateComponent,
    PageTitleComponent,
    ViewModeToggleComponent,
    ProgressRingIconComponent,
  ],
  templateUrl: './grupo-detail.component.html',
  host: { class: 'block page-shell-wide' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrupoDetailComponent implements OnInit, OnDestroy {
  private readonly groupService = inject(GroupService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  protected readonly auth = inject(AuthService);
  private readonly destruido = new Subject<void>();
  readonly id = input.required<string>();

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly group = signal<Group | null>(null);
  protected readonly ranking = signal<GroupRankingEntry[]>([]);
  protected readonly atividade = signal<GroupActivityItem[]>([]);
  protected readonly saindo = signal(false);
  protected readonly excluindo = signal(false);
  protected readonly confirmacao = signal<'sair' | 'excluir' | null>(null);
  protected readonly modo = signal<ModoVisualizacao>('ranking');
  private atividadeCarregada = false;
  protected readonly carregandoAtividade = signal(false);
  protected readonly carregandoAtividadeVisivel = gateCarregamento(this.carregandoAtividade);
  protected readonly resumoDashboard = signal<DashboardResumo | null>(null);
  protected readonly carregandoMissoes = signal(true);

  protected readonly minhaEntrada = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return this.ranking().find((entry) => entry.user.id === userId) ?? null;
  });

  protected readonly minhaPosicao = computed(() => {
    const userId = this.auth.currentUser()?.id;
    const indice = this.ranking().findIndex((entry) => entry.user.id === userId);
    return indice >= 0 ? indice + 1 : null;
  });

  /** Participante imediatamente à frente do usuário no placar atual. */
  protected readonly rivalAcima = computed(() => {
    const posicao = this.minhaPosicao();
    return posicao && posicao > 1 ? this.ranking()[posicao - 2] : null;
  });

  protected readonly xpParaUltrapassar = computed(() => {
    const minhaEntrada = this.minhaEntrada();
    const rival = this.rivalAcima();
    if (!minhaEntrada || !rival) return null;
    return Math.max(0, rival.xp_periodo - minhaEntrada.xp_periodo + 1);
  });

  protected readonly meuProgresso = computed(
    () => this.minhaEntrada()?.progresso_percent ?? this.group()?.voce?.progresso_percent ?? 0,
  );

  protected readonly meuNivel = computed(
    () => this.minhaEntrada()?.nivel ?? this.group()?.voce?.nivel ?? 1,
  );

  protected readonly meuXp = computed(
    () => this.minhaEntrada()?.xp_periodo ?? this.group()?.voce?.xp_periodo ?? 0,
  );

  protected readonly membrosCount = computed(
    () => this.ranking().length || this.group()?.members_count || 1,
  );

  protected readonly missoesDiarias = computed(
    () => this.resumoDashboard()?.progressao.diarias ?? [],
  );

  protected readonly missoesDiariasConcluidas = computed(
    () => this.missoesDiarias().filter((missao) => missao.concluida).length,
  );

  protected readonly modoOpcoes = computed<ViewModeOption[]>(() => {
    this.language.locale();
    return [
      {
        value: 'ranking',
        label: this.transloco.translate('groups.detail.rankingTab'),
        icon: LucideHeartPulse,
      },
      {
        value: 'atividade',
        label: this.transloco.translate('groups.detail.activityTab'),
        icon: LucideActivity,
      },
    ];
  });

  protected readonly ehDono = computed(
    () => this.group()?.owner_id === this.auth.currentUser()?.id,
  );

  protected readonly ehGlobal = computed(() => this.group()?.is_global ?? false);

  protected readonly tituloRanking = computed(() => {
    switch (this.group()?.challenge_type) {
      case 'monthly':
        return 'groups.leaderboard.titleMonthly';
      case 'all_time':
        return 'groups.leaderboard.titleAllTime';
      case 'custom':
        return 'groups.leaderboard.titleCustom';
      default:
        return 'groups.leaderboard.titleWeekly';
    }
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected alterarModo(modo: ModoVisualizacao): void {
    this.modo.set(modo);
  }

  protected formatarQuando(iso: string): string {
    const data = new Date(iso);
    const agora = new Date();
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    const locale = this.language.locale();
    const hora = data.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    if (data.toDateString() === agora.toDateString()) {
      return `${this.transloco.translate('groups.activity.today')} · ${hora}`;
    }
    if (data.toDateString() === ontem.toDateString()) {
      return `${this.transloco.translate('groups.activity.yesterday')} · ${hora}`;
    }
    const dia = data.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
    return `${dia} · ${hora}`;
  }

  protected copiarCodigo(): void {
    const codigo = this.group()?.invite_code;
    if (!codigo) return;
    navigator.clipboard
      .writeText(codigo)
      .then(() => this.toastr.success(this.transloco.translate('groups.toast.copied')))
      .catch(() => undefined);
  }

  protected solicitarSaida(): void {
    this.confirmacao.set('sair');
  }

  protected solicitarExclusao(): void {
    this.confirmacao.set('excluir');
  }

  protected fecharConfirmacao(): void {
    this.confirmacao.set(null);
  }

  protected confirmarAcao(): void {
    const acao = this.confirmacao();
    this.confirmacao.set(null);
    if (acao === 'sair') this.sairDoGrupo();
    else if (acao === 'excluir') this.excluirGrupo();
  }

  private sairDoGrupo(): void {
    const group = this.group();
    if (!group || this.saindo()) return;

    this.saindo.set(true);
    this.groupService
      .leave(group.id)
      .pipe(
        finalize(() => this.saindo.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: () => {
          this.toastr.success(this.transloco.translate('groups.toast.left'));
          this.router.navigateByUrl('/grupos');
        },
        error: () => this.toastr.error(this.transloco.translate('groups.toast.genericError')),
      });
  }

  private excluirGrupo(): void {
    const group = this.group();
    if (!group || this.excluindo()) return;

    this.excluindo.set(true);
    this.groupService
      .remove(group.id)
      .pipe(
        finalize(() => this.excluindo.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: () => {
          this.toastr.success(this.transloco.translate('groups.toast.deleted'));
          this.router.navigateByUrl('/grupos');
        },
        error: () => this.toastr.error(this.transloco.translate('groups.toast.genericError')),
      });
  }

  private load(): void {
    const id = Number(this.id());
    forkJoin({
      group: this.groupService.get(id),
      ranking: this.groupService.ranking(id),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: ({ group, ranking }) => {
          this.group.set(group);
          this.ranking.set(ranking);
          this.carregarAtividade();
          this.carregarMissoes();
        },
        error: () => {
          this.toastr.error(this.transloco.translate('groups.toast.genericError'));
          this.router.navigateByUrl('/grupos');
        },
      });
  }

  private carregarAtividade(): void {
    const group = this.group();
    if (!group || this.carregandoAtividade()) return;

    this.carregandoAtividade.set(true);
    this.groupService
      .activity(group.id)
      .pipe(
        finalize(() => this.carregandoAtividade.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (atividade) => {
          this.atividade.set(atividade);
          this.atividadeCarregada = true;
        },
        error: () => this.toastr.error(this.transloco.translate('groups.toast.genericError')),
      });
  }

  private carregarMissoes(): void {
    this.carregandoMissoes.set(true);
    this.dashboardService
      .resumo()
      .pipe(
        finalize(() => this.carregandoMissoes.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (resumo) => this.resumoDashboard.set(resumo),
        error: () => this.resumoDashboard.set(null),
      });
  }
}
