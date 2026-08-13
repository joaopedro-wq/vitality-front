import { ChangeDetectionStrategy, Component, input } from '@angular/core';


@Component({
  selector: 'vtp-auth-poster-layout',
  standalone: true,
  templateUrl: './auth-poster-layout.component.html',
  styleUrl: './auth-poster-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPosterLayoutComponent {
  readonly badge = input<string>('');
}
