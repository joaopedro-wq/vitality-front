import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  type WritableSignal,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { BdAvatarComponent, BdButtonComponent, BdCountUpDirective } from 'bandeira-ui';
import {
  LucideActivity,
  LucideCheckCheck,
  LucideCopy,
  LucideCrown,
  LucideLogOut,
  LucideTrash2,
  LucideTrophy,
  LucideUsersRound,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, forkJoin, takeUntil } from 'rxjs';

import { AchievementBadgeComponent } from '../../../components/molecules/achievement-badge/achievement-badge.component';
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
import { animarProgresso } from '../../../components/utils/progresso-animado.util';
import { AuthService } from '../../../core/auth/auth.service';
import { LanguageService } from '../../../core/i18n/language.service';
import type { Group, GroupActivityItem, GroupRankingEntry } from '../../../core/models/group.model';
import { GroupService } from '../../../services/group.service';

type ModoVisualizacao = 'ranking' | 'atividade';

const MEDALHAS = ['🥇', '🥈', '🥉'] as const;

@Component({
  selector: 'vtp-grupo-detail',
  standalone: true,
  imports: [
    TranslocoPipe,
    BdButtonComponent,
    BdAvatarComponent,
    BdCountUpDirective,
    LucideCheckCheck,
    LucideCopy,
    LucideCrown,
    LucideLogOut,
    LucideTrash2,
    LucideTrophy,
    LucideUsersRound,
    AchievementBadgeComponent,
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

  protected readonly modoOpcoes: ViewModeOption[] = [
    { value: 'ranking', label: 'Ranking', icon: LucideTrophy },
    { value: 'atividade', label: 'Atividade', icon: LucideActivity },
  ];

  protected readonly temPodio = computed(() => this.ranking().length >= 3);
  protected readonly top3 = computed(() => this.ranking().slice(0, 3));
  protected readonly restante = computed(() => this.ranking().slice(3));

  private readonly progressoPorUsuario = new Map<number, WritableSignal<number>>();

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
    if (modo === 'atividade' && !this.atividadeCarregada) this.carregarAtividade();
  }

  protected medalha(posicao: number): string | null {
    return MEDALHAS[posicao] ?? null;
  }

  protected progressoDe(userId: number): number {
    return this.progressoPorUsuario.get(userId)?.() ?? 0;
  }

  private duracaoPorPosicao(indice: number): number {
    if (indice === 0) return 1600;
    if (indice === 1 || indice === 2) return 1300;
    return 1000;
  }

  protected primeiroNome(nomeCompleto: string): string {
    return nomeCompleto.split(' ')[0];
  }

  protected atrasoLinha(posicao: number): number {
    return (this.temPodio() ? 900 : 0) + posicao * 200;
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

          this.progressoPorUsuario.clear();
          ranking.forEach((entry, indice) => {
            const sinal = signal(0);
            this.progressoPorUsuario.set(entry.user.id, sinal);
            animarProgresso(sinal, entry.progresso_percent, this.duracaoPorPosicao(indice));
          });
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
}
