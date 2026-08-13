import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { BdAvatarComponent, BdButtonComponent } from 'bandeira-ui';
import { LucideCamera, LucideLoaderCircle, LucideTrash2, LucideX } from '@lucide/angular';

/**
 * "Crachá de jogador" — mesma linguagem visual do `MetaRevealComponent`
 * (anel com glow, revelação por camadas) aplicada ao avatar: reforça que
 * Perfil e Metas são a mesma identidade de produto, não duas telas soltas.
 * O selo de progresso vem de `calcularProgressoPerfil` (`components/utils/`).
 *
 * `somenteLeitura` esconde as ações de trocar/remover foto — usado na tela
 * de conclusão do quiz, onde o crachá é só celebração, não formulário.
 */
@Component({
  selector: 'vtp-profile-photo-card',
  standalone: true,
  imports: [BdAvatarComponent, BdButtonComponent, LucideCamera, LucideLoaderCircle, LucideTrash2, LucideX],
  templateUrl: './profile-photo-card.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePhotoCardComponent {
  readonly name = input.required<string>();
  readonly email = input.required<string>();
  readonly src = input('');
  readonly progresso = input(0);
  readonly somenteLeitura = input(false, { transform: booleanAttribute });
  readonly selectedFileName = input<string | null>(null);
  readonly removendo = input(false);

  readonly escolher = output<File>();
  readonly cancelar = output<void>();
  readonly remover = output<void>();

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.escolher.emit(file);
  }
}
