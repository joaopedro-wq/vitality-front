import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionInactivityService } from './core/auth/session-inactivity.service';

@Component({
  selector: 'vtp-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly sessionInactivity = inject(SessionInactivityService);
}
