import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideHeart, LucideSearch, LucideShieldCheck, LucideX } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import type { Alimento } from '../../../core/models/alimento.model';
import { AuthService } from '../../../core/auth/auth.service';
import { AlimentoService } from '../../../services/alimento.service';

@Component({
  selector: 'vtp-alimentos-list',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    BdButtonComponent,
    LucideHeart,
    LucideSearch,
    LucideShieldCheck,
    LucideX,
  ],
  templateUrl: './alimentos-list.component.html',
  styleUrl: './alimentos-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlimentosListComponent {
  private readonly alimentosService = inject(AlimentoService);
  protected readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  protected readonly tab = signal<'all' | 'favorites'>('all');
  protected readonly busca = signal('');
  protected readonly alimentos = signal<Alimento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly pagina = signal(1);
  protected readonly ultimaPagina = signal(1);
  protected readonly detalhe = signal<Alimento | null>(null);
  protected readonly vazio = computed(() => !this.carregando() && this.alimentos().length === 0);

  constructor() {
    this.load();
  }

  selecionarTab(tab: 'all' | 'favorites'): void {
    this.tab.set(tab);
    this.pagina.set(1);
    this.load();
  }
  buscar(value: string): void {
    this.busca.set(value);
    this.pagina.set(1);
    this.load();
  }
  irParaPagina(page: number): void {
    this.pagina.set(page);
    this.load();
  }

  alternarFavorito(food: Alimento): void {
    const anterior = food.is_favorite;
    this.alimentos.update((items) =>
      items.map((item) => (item.id === food.id ? { ...item, is_favorite: !anterior } : item)),
    );
    const onError = () => {
      this.alimentos.update((items) =>
        items.map((item) => (item.id === food.id ? { ...item, is_favorite: anterior } : item)),
      );
      this.toastr.error('Não foi possível atualizar seus favoritos.');
    };
    if (anterior) this.alimentosService.unfavorite(food.id).subscribe({ error: onError });
    else this.alimentosService.favorite(food.id).subscribe({ error: onError });
  }

  private load(): void {
    this.carregando.set(true);
    this.alimentosService
      .list({ tab: this.tab(), search: this.busca(), page: this.pagina() })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (response) => {
          this.alimentos.set(response.data);
          this.ultimaPagina.set(response.meta.last_page);
        },
        error: () => this.toastr.error('Não foi possível carregar o catálogo agora.'),
      });
  }
}
