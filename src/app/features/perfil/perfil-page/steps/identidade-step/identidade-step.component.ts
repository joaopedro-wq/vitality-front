import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { BdFieldComponent, BdInputComponent } from 'bandeira-ui';
import {
  LucideDynamicIcon,
  LucideMars,
  LucideUsersRound,
  LucideVenus,
  type LucideIcon,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, catchError, finalize, switchMap } from 'rxjs';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import { ProfilePhotoCardComponent } from '../../../../../components/molecules/profile-photo-card/profile-photo-card.component';
import { calcularProgressoPerfil } from '../../../../../components/utils/perfil-progresso.util';
import { AuthService } from '../../../../../core/auth/auth.service';
import type { Genero, UpdateUserPayload, User } from '../../../../../core/models/user.model';
import { UserService } from '../../../../../services/user.service';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif']);

const GENERO_OPTIONS: { value: Genero; label: string; icone: LucideIcon }[] = [
  { value: 'M', label: 'Masculino', icone: LucideMars },
  { value: 'F', label: 'Feminino', icone: LucideVenus },
  { value: 'O', label: 'Outro', icone: LucideUsersRound },
];

@Component({
  selector: 'vtp-identidade-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    BdFieldComponent,
    BdInputComponent,
    StepFooterComponent,
    ProfilePhotoCardComponent,
    LucideDynamicIcon,
  ],
  templateUrl: './identidade-step.component.html',
  host: { class: 'block animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentidadeStepComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastr = inject(ToastrService);

  readonly salvo = output<User>();
  protected readonly user = this.auth.currentUser;
  protected readonly generoOptions = GENERO_OPTIONS;
  protected readonly salvando = signal(false);
  protected readonly removendoAvatar = signal(false);
  protected readonly avatarSelecionado = signal<File | null>(null);
  private readonly avatarPreview = signal<string | null>(null);
  protected readonly avatarSrc = computed(() => this.avatarPreview() ?? this.user()?.avatar ?? '');
  protected readonly progresso = computed(() =>
    calcularProgressoPerfil(this.user(), this.avatarSelecionado() !== null),
  );
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    data_nascimento: ['', Validators.required],
    genero: ['M' as Genero, Validators.required],
  });

  constructor() {
    const user = this.user();
    if (user) {
      this.form.patchValue({
        name: user.name,
        email: user.email,
        data_nascimento: user.data_nascimento?.slice(0, 10) ?? '',
        genero: user.genero ?? 'M',
      });
    }
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  selecionarAvatar(arquivo: File): void {
    if (!arquivo) return;

    if (!AVATAR_TYPES.has(arquivo.type) || arquivo.size > MAX_AVATAR_BYTES) {
      this.toastr.error('Use uma imagem JPG, PNG ou GIF de até 2 MB.');
      return;
    }

    this.revokePreview();
    this.avatarSelecionado.set(arquivo);
    this.avatarPreview.set(URL.createObjectURL(arquivo));
  }

  cancelarAvatarSelecionado(): void {
    this.avatarSelecionado.set(null);
    this.revokePreview();
  }

  removerAvatar(): void {
    const user = this.user();
    if (!user?.avatar || this.removendoAvatar()) return;

    this.removendoAvatar.set(true);
    this.userService
      .removeAvatar()
      .pipe(finalize(() => this.removendoAvatar.set(false)))
      .subscribe({
        next: () => {
          this.auth.setCurrentUser({ ...user, avatar: null });
          this.toastr.success('Foto de perfil removida.');
        },
        error: () => this.toastr.error('Não foi possível remover a foto agora. Tente de novo.'),
      });
  }

  avancar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Revise os campos destacados antes de continuar.');
      return;
    }

    const user = this.user();
    if (!user || this.salvando()) return;

    const payload = this.form.getRawValue() satisfies UpdateUserPayload;
    const avatar = this.avatarSelecionado();
    this.salvando.set(true);
    this.userService
      .updateProfile(payload)
      .pipe(
        switchMap((atualizado) => (avatar ? this.userService.uploadAvatar(avatar) : [atualizado])),
        finalize(() => this.salvando.set(false)),
        catchError(() => {
          this.toastr.error('Não foi possível salvar seus dados agora. Tente de novo.');
          return EMPTY;
        }),
      )
      .subscribe((atualizado) => {
        this.avatarSelecionado.set(null);
        this.revokePreview();
        this.salvo.emit(atualizado);
      });
  }

  private revokePreview(): void {
    const preview = this.avatarPreview();
    if (preview) URL.revokeObjectURL(preview);
    this.avatarPreview.set(null);
  }
}
