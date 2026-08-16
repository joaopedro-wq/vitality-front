import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BdButtonComponent, BdFieldComponent, BdInputComponent } from 'bandeira-ui';
import { LucideArchive, LucideArrowLeft, LucidePlus, LucideRefreshCw } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import type {
  Alimento,
  FoodPlanTag,
  FoodRestriction,
  FonteAlimento,
  StatusAlimento,
} from '../../../core/models/alimento.model';
import { AlimentoService } from '../../../services/alimento.service';
import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { LoadingOverlayComponent } from '../../../components/organisms/loading-overlay/loading-overlay.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';

const MENSAGENS_IMPORTACAO: string[] = [
  'Baixando o catálogo oficial…',
  'Conferindo os alimentos já cadastrados…',
  'Atualizando macros e nutrientes…',
];

@Component({
  selector: 'vtp-admin-foods',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    BdButtonComponent,
    BdFieldComponent,
    BdInputComponent,
    LucideArchive,
    LucideArrowLeft,
    LucidePlus,
    LucideRefreshCw,
    PlateLoaderComponent,
    LoadingStateComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './admin-foods.component.html',
  styleUrl: './admin-foods.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFoodsComponent {
  private readonly service = inject(AlimentoService);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  protected readonly foods = signal<Alimento[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly importing = signal(false);
  protected readonly mensagensImportacao = MENSAGENS_IMPORTACAO;
  protected readonly saving = signal(false);
  protected readonly source = signal<FonteAlimento | ''>('');
  protected readonly status = signal<StatusAlimento | ''>('');
  protected readonly search = signal('');
  protected readonly editing = signal<Alimento | null>(null);
  protected readonly duplicados = signal<Alimento[]>([]);
  protected readonly planTags = signal<FoodPlanTag[]>([]);
  protected readonly selectedPlanTags = signal<string[]>([]);
  protected readonly restrictions = signal<FoodRestriction[]>([]);
  protected readonly selectedRestrictions = signal<string[]>([]);
  protected readonly textoDuplicados = computed(() =>
    this.duplicados()
      .map((item) => item.descricao)
      .join(' · '),
  );
  protected readonly form = this.fb.nonNullable.group({
    descricao: ['', Validators.required],
    grupo: [''],
    proteina: [0, [Validators.required, Validators.min(0)]],
    gordura: [0, [Validators.required, Validators.min(0)]],
    carbo: [0, [Validators.required, Validators.min(0)]],
    caloria: [0, [Validators.required, Validators.min(0)]],
    qtd: [100, [Validators.required, Validators.min(1)]],
  });
  constructor() {
    this.load();
    this.service.planTags().subscribe({ next: (tags) => this.planTags.set(tags) });
    this.service
      .restrictions()
      .subscribe({ next: (restrictions) => this.restrictions.set(restrictions) });
  }
  filter(): void {
    this.load();
  }
  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      descricao: '',
      grupo: '',
      proteina: 0,
      gordura: 0,
      carbo: 0,
      caloria: 0,
      qtd: 100,
    });
    this.selectedPlanTags.set([]);
    this.selectedRestrictions.set([]);
  }
  edit(food: Alimento): void {
    this.editing.set(food);
    this.form.setValue({
      descricao: food.descricao,
      grupo: food.grupo ?? '',
      proteina: food.proteina,
      gordura: food.gordura,
      carbo: food.carbo,
      caloria: food.caloria,
      qtd: food.qtd,
    });
    this.selectedPlanTags.set(food.plan_tags?.map((tag) => tag.slug) ?? []);
    this.selectedRestrictions.set(food.restrictions?.map((restriction) => restriction.slug) ?? []);
  }
  togglePlanTag(slug: string): void {
    this.selectedPlanTags.update((selected) =>
      selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug],
    );
  }
  toggleRestriction(slug: string): void {
    this.selectedRestrictions.update((selected) =>
      selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug],
    );
  }
  verificarDuplicados(): void {
    const descricao = this.form.controls.descricao.value.trim();
    if (descricao.length < 3 || this.editing()) {
      this.duplicados.set([]);
      return;
    }
    this.service.duplicates(descricao).subscribe({
      next: (foods) => this.duplicados.set(foods),
      error: () => this.duplicados.set([]),
    });
  }
  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue();
    const editing = this.editing();
    this.saving.set(true);
    (editing ? this.service.update(editing.id, payload) : this.service.create(payload))
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (saved) => {
          this.service.updatePlanTags(saved.id, this.selectedPlanTags()).subscribe({
            next: () => undefined,
            error: () =>
              this.toastr.error(
                'O alimento foi salvo, mas não foi possível atualizar suas classificações.',
              ),
          });
          this.service.updateRestrictions(saved.id, this.selectedRestrictions()).subscribe({
            next: () => undefined,
            error: () =>
              this.toastr.error(
                'O alimento foi salvo, mas não foi possível atualizar suas restrições.',
              ),
          });
          this.toastr.success(editing ? 'Alimento atualizado.' : 'Alimento criado.');
          this.openCreate();
          this.load();
        },
        error: () => this.toastr.error('Não foi possível salvar o alimento.'),
      });
  }
  archive(food: Alimento): void {
    const request =
      food.status === 'arquivado' ? this.service.restore(food.id) : this.service.archive(food.id);
    request.subscribe({
      next: () => {
        this.toastr.success(
          food.status === 'arquivado' ? 'Alimento restaurado.' : 'Alimento arquivado.',
        );
        this.load();
      },
      error: () => this.toastr.error('Não foi possível alterar o status.'),
    });
  }
  importTaco(): void {
    if (this.importing()) return;
    this.importing.set(true);
    this.service
      .importTaco()
      .pipe(finalize(() => this.importing.set(false)))
      .subscribe({
        next: (r) => {
          this.toastr.success(`TACO processada: ${r.created} criados e ${r.updated} atualizados.`);
          this.load();
        },
        error: () => this.toastr.error('Não foi possível importar a TACO.'),
      });
  }
  private load(): void {
    this.loading.set(true);
    this.service
      .adminList({
        search: this.search(),
        fonte: this.source() || undefined,
        status: this.status() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => this.foods.set(r.data),
        error: () => this.toastr.error('Não foi possível carregar o catálogo.'),
      });
  }
}
