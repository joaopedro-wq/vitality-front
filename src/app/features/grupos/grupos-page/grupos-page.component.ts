import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  type WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  BdAvatarComponent,
  BdButtonComponent,
  BdCountUpDirective,
  BdInputComponent,
  BdModalComponent,
} from 'bandeira-ui';
import {
  LucideArrowRight,
  LucideCalendar,
  LucideCalendarDays,
  LucideCalendarRange,
  LucideDynamicIcon,
  LucideFlower2,
  LucideHeartPulse,
  LucideInfinity,
  LucideLeaf,
  LucidePlus,
  LucideSprout,
  LucideUsersRound,
  type LucideIcon,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, takeUntil } from 'rxjs';

import { ProgressRingIconComponent } from '../../../components/atoms/progress-ring-icon/progress-ring-icon.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { animarProgresso } from '../../../components/utils/progresso-animado.util';
import type { ChallengeType, Group } from '../../../core/models/group.model';
import { GroupService } from '../../../services/group.service';

interface OpcaoDesafio {
  value: ChallengeType;
  label: string;
  hint: string;
  icone: LucideIcon;
}

type AbaModal = 'criar' | 'entrar';

@Component({
  selector: 'vtp-grupos-page',
  standalone: true,
  imports: [
    TranslocoPipe,
    BdAvatarComponent,
    BdButtonComponent,
    BdCountUpDirective,
    BdInputComponent,
    BdModalComponent,
    LucideArrowRight,
    LucideHeartPulse,
    LucideDynamicIcon,
    LucidePlus,
    LucideUsersRound,
    LoadingStateComponent,
    PageTitleComponent,
    ProgressRingIconComponent,
  ],
  templateUrl: './grupos-page.component.html',
  host: { class: 'block page-shell-wide' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposPageComponent implements OnDestroy {
  private readonly groupService = inject(GroupService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private readonly destruido = new Subject<void>();

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly groups = signal<Group[]>([]);
  protected readonly criando = signal(false);
  protected readonly entrando = signal(false);
  protected readonly nomeNovoGrupo = signal('');
  protected readonly codigoConvite = signal('');
  protected readonly tipoDesafio = signal<ChallengeType>('weekly');
  protected readonly dataInicio = signal('');
  protected readonly dataFim = signal('');

  protected readonly modalAberto = signal(false);
  protected readonly abaModal = signal<AbaModal>('criar');

  private readonly progressoPorGrupo = new Map<number, WritableSignal<number>>();

  protected readonly ligasOrdenadas = computed(() =>
    [...this.groups()].sort((a, b) => Number(b.is_global) - Number(a.is_global)),
  );

  protected readonly ligaDestaque = computed(() => this.ligasOrdenadas()[0] ?? null);

  protected readonly outrasLigas = computed(() => {
    const destaque = this.ligaDestaque();
    return this.ligasOrdenadas().filter((group) => group.id !== destaque?.id);
  });

  protected readonly xpEmRitmo = computed(() =>
    this.groups().reduce((total, group) => total + (group.voce?.xp_periodo ?? 0), 0),
  );

  protected readonly nivelAtual = computed(() => this.ligaDestaque()?.voce?.nivel ?? 1);

  protected readonly opcoesDesafio: OpcaoDesafio[] = [
    {
      value: 'weekly',
      label: 'groups.challengeType.weekly',
      hint: 'groups.challengeType.weeklyHint',
      icone: LucideCalendarDays,
    },
    {
      value: 'monthly',
      label: 'groups.challengeType.monthly',
      hint: 'groups.challengeType.monthlyHint',
      icone: LucideCalendar,
    },
    {
      value: 'all_time',
      label: 'groups.challengeType.all_time',
      hint: 'groups.challengeType.all_timeHint',
      icone: LucideInfinity,
    },
    {
      value: 'custom',
      label: 'groups.challengeType.custom',
      hint: 'groups.challengeType.customHint',
      icone: LucideCalendarRange,
    },
  ];

  protected readonly podeCriar = computed(() => {
    if (!this.nomeNovoGrupo().trim()) return false;
    if (this.tipoDesafio() === 'custom') return Boolean(this.dataInicio() && this.dataFim());
    return true;
  });

  protected readonly podeEntrar = computed(() => this.codigoConvite().trim().length > 0);

  constructor() {
    this.load();
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  protected abrirGrupo(group: Group): void {
    this.router.navigate(['/grupos', group.id]);
  }

  /** Anel "canteiro": broto → folha → flor conforme o nível — mesmo espírito do pódio, sem
   * pódio/troféu (ver decisão de identidade, CLAUDE.md). */
  protected iconeCanteiro(nivel: number): LucideIcon {
    if (nivel >= 8) return LucideFlower2;
    if (nivel >= 4) return LucideLeaf;
    return LucideSprout;
  }

  protected progressoDe(groupId: number): number {
    return this.progressoPorGrupo.get(groupId)?.() ?? 0;
  }

  protected abrirModal(aba: AbaModal = 'criar'): void {
    this.abaModal.set(aba);
    this.modalAberto.set(true);
  }

  protected fecharModal(): void {
    this.modalAberto.set(false);
  }

  protected onModalOpenChange(open: boolean): void {
    if (!open) this.fecharModal();
  }

  protected escolherAbaModal(aba: AbaModal): void {
    this.abaModal.set(aba);
  }

  protected escolherTipoDesafio(tipo: ChallengeType): void {
    this.tipoDesafio.set(tipo);
  }

  protected criarGrupo(): void {
    if (!this.podeCriar() || this.criando()) return;

    this.criando.set(true);
    this.groupService
      .create({
        name: this.nomeNovoGrupo().trim(),
        challenge_type: this.tipoDesafio(),
        ...(this.tipoDesafio() === 'custom'
          ? { challenge_starts_at: this.dataInicio(), challenge_ends_at: this.dataFim() }
          : {}),
      })
      .pipe(
        finalize(() => this.criando.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (group) => {
          this.groups.update((current) => [...current, group]);
          this.nomeNovoGrupo.set('');
          this.dataInicio.set('');
          this.dataFim.set('');
          this.modalAberto.set(false);
          this.toastr.success(this.transloco.translate('groups.toast.created'));
          this.abrirGrupo(group);
        },
        error: () => this.toastr.error(this.transloco.translate('groups.toast.genericError')),
      });
  }

  protected entrarComCodigo(): void {
    const codigo = this.codigoConvite().trim().toUpperCase();
    if (!codigo || this.entrando()) return;

    this.entrando.set(true);
    this.groupService
      .join(codigo)
      .pipe(
        finalize(() => this.entrando.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (group) => {
          this.codigoConvite.set('');
          this.modalAberto.set(false);
          this.toastr.success(this.transloco.translate('groups.toast.joined'));
          this.abrirGrupo(group);
        },
        error: () => this.toastr.error(this.transloco.translate('groups.toast.invalidCode')),
      });
  }

  private load(): void {
    this.groupService
      .list()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);

          this.progressoPorGrupo.clear();
          groups.forEach((group, indice) => {
            const sinal = signal(0);
            this.progressoPorGrupo.set(group.id, sinal);
            animarProgresso(sinal, group.voce?.progresso_percent ?? 0, 900 + indice * 110);
          });
        },
        error: () => this.toastr.error(this.transloco.translate('groups.toast.loadError')),
      });
  }
}
