import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideArrowRight, LucideCheck } from '@lucide/angular';
import { BdButtonComponent, BdModalComponent } from 'bandeira-ui';

import { OnboardingService } from './onboarding.service';

@Component({
  selector: 'vtp-onboarding-welcome',
  standalone: true,
  imports: [BdModalComponent, BdButtonComponent, TranslocoPipe, LucideArrowRight, LucideCheck],
  templateUrl: './onboarding-welcome.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingWelcomeComponent {
  protected readonly onboarding = inject(OnboardingService);

  protected onOpenChange(open: boolean): void {
    if (!open) this.onboarding.dismissWelcome();
  }
}
