import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BdButtonComponent } from 'bandeira-ui';

import { ProfilePhotoCardComponent } from '../../../components/molecules/profile-photo-card/profile-photo-card.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import {
  StepTrackComponent,
  type StepTrackItem,
} from '../../../components/molecules/step-track/step-track.component';
import { calcularProgressoPerfil } from '../../../components/utils/perfil-progresso.util';
import { AuthService } from '../../../core/auth/auth.service';
import type { User } from '../../../core/models/user.model';
import { CorpoStepComponent } from './steps/corpo-step/corpo-step.component';
import { IdentidadeStepComponent } from './steps/identidade-step/identidade-step.component';
import { RotinaStepComponent } from './steps/rotina-step/rotina-step.component';

const PASSOS: StepTrackItem[] = [
  { titulo: 'Identidade', descricao: 'Dados pessoais e foto' },
  { titulo: 'Corpo', descricao: 'Peso e altura' },
  { titulo: 'Rotina', descricao: 'Atividade e objetivo' },
];

@Component({
  selector: 'vtp-perfil-page',
  standalone: true,
  imports: [
    BdButtonComponent,
    ProfilePhotoCardComponent,
    PageTitleComponent,
    StepTrackComponent,
    IdentidadeStepComponent,
    CorpoStepComponent,
    RotinaStepComponent,
  ],
  templateUrl: './perfil-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPageComponent {
  private readonly auth = inject(AuthService);

  protected readonly passos = PASSOS;
  protected readonly user = this.auth.currentUser;
  protected readonly passo = signal(0);
  protected readonly concluido = signal(false);
  protected readonly progresso = computed(() => calcularProgressoPerfil(this.user()));

  irPara(indice: number): void {
    if (indice <= this.passo()) this.passo.set(indice);
  }

  onSalvo(user: User, proximoPasso: number): void {
    this.auth.setCurrentUser(user);
    if (proximoPasso >= this.passos.length) {
      this.concluido.set(true);
      return;
    }
    this.passo.set(proximoPasso);
  }

  editarNovamente(): void {
    this.concluido.set(false);
    this.passo.set(0);
  }
}
