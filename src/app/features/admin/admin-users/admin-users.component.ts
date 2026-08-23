import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BdButtonComponent, BdInputComponent } from 'bandeira-ui';
import { LucideSearch, LucideUsers, LucideX } from '@lucide/angular';
import type { TableLazyLoadEvent } from 'primeng/table';
import { finalize } from 'rxjs';

import type {
  AdminUser,
  AdminUserDetail,
  AdminUserEngagement,
  AdminUsersPage,
} from '../../../core/models/admin-user.model';
import { AdminUsersService } from '../../../services/admin-users.service';
import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import {
  DataTableComponent,
  type DataTableColumn,
} from '../../../components/molecules/data-table/data-table.component';
import { PaginationControlsComponent } from '../../../components/molecules/pagination-controls/pagination-controls.component';

@Component({
  selector: 'vtp-admin-users',
  standalone: true,
  imports: [
    DatePipe,
    BdButtonComponent,
    BdInputComponent,
    LucideSearch,
    LucideUsers,
    LucideX,
    BackButtonComponent,
    PageTitleComponent,
    LoadingStateComponent,
    DataTableComponent,
    PaginationControlsComponent,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent {
  private readonly service = inject(AdminUsersService);
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly meta = signal<AdminUsersPage['meta'] | null>(null);
  protected readonly loading = signal(true);
  protected readonly detailLoading = signal(false);
  protected readonly selected = signal<AdminUserDetail | null>(null);
  protected readonly search = signal('');
  protected readonly period = signal<7 | 30 | 90>(30);
  protected readonly accountType = signal<'all' | 'admin' | 'member'>('all');
  protected readonly engagementStatus = signal<AdminUserEngagement | 'all'>('all');
  protected readonly page = signal(1);
  protected readonly sortField = signal<'name' | 'created_at'>('created_at');
  protected readonly sortOrder = signal<1 | -1>(-1);
  protected readonly tableColumns: DataTableColumn<AdminUser>[] = [
    {
      field: 'name',
      header: 'Usuário',
      frozen: true,
      multiline: true,
      value: (user) => `${user.name}\n${user.email}`,
    },
    { field: 'created_at', header: 'Cadastro', value: (user) => this.date(user.created_at) },
    {
      field: 'last_action_at',
      header: 'Última ação',
      sortable: false,
      value: (user) => this.date(user.last_action_at),
    },
    { field: 'active_days', header: 'Dias ativos', align: 'end', sortable: false },
    {
      field: 'resources',
      header: 'Recursos usados',
      sortable: false,
      value: (user) => `${user.diary_entries_count} registros · ${user.plans_count} planos`,
    },
    {
      field: 'engagement_status',
      header: 'Status',
      sortable: false,
      badge: (user) => user.engagement_status,
      value: (user) => this.statusLabel(user.engagement_status),
    },
  ];

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    const engagementStatus = this.engagementStatus();
    this.service
      .list({
        search: this.search(),
        period: this.period(),
        is_admin: this.accountType() === 'all' ? undefined : this.accountType() === 'admin',
        engagement_status: engagementStatus === 'all' ? undefined : engagementStatus,
        page: this.page(),
        sort: this.sortField(),
        direction: this.sortOrder() === 1 ? 'asc' : 'desc',
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.meta.set(response.meta);
        },
        error: () => {
          this.users.set([]);
          this.meta.set(null);
        },
      });
  }

  protected changePeriod(value: string): void {
    this.period.set(Number(value) as 7 | 30 | 90);
    this.page.set(1);
    this.load();
  }
  protected changeAccountType(value: string): void {
    this.accountType.set(value as 'all' | 'admin' | 'member');
    this.page.set(1);
    this.load();
  }
  protected changeEngagementStatus(value: string): void {
    this.engagementStatus.set(value as AdminUserEngagement | 'all');
    this.page.set(1);
    this.load();
  }
  protected searchUsers(value: string): void {
    this.search.set(value.trim());
    this.page.set(1);
    this.load();
  }
  protected clearFilters(): void {
    this.search.set('');
    this.accountType.set('all');
    this.engagementStatus.set('all');
    this.period.set(30);
    this.page.set(1);
    this.load();
  }
  protected goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }
  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const field = event.sortField === 'name' ? 'name' : 'created_at';
    this.sortField.set(field);
    this.sortOrder.set(event.sortOrder === 1 ? 1 : -1);
    this.page.set(1);
    this.load();
  }
  protected openDetail(user: AdminUser): void {
    this.detailLoading.set(true);
    this.selected.set(null);
    this.service
      .detail(user.id, this.period())
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({ next: (response) => this.selected.set(response.data) });
  }
  protected closeDetail(): void {
    this.selected.set(null);
  }
  protected statusLabel(status: AdminUser['engagement_status']): string {
    return { novo: 'Novo', em_ativacao: 'Em ativação', engajado: 'Engajado', inativo: 'Inativo' }[
      status
    ];
  }
  private date(value: string | null): string {
    return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—';
  }
}
