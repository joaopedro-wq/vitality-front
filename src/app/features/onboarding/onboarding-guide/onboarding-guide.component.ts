import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BdButtonComponent, BdModalComponent } from 'bandeira-ui';
import { LucideClipboardList, LucideTarget, LucideUtensils } from '@lucide/angular';

import { OnboardingService } from '../../../core/onboarding/onboarding.service';

@Component({
  selector: 'vtp-onboarding-guide',
  standalone: true,
  imports: [
    BdButtonComponent,
    BdModalComponent,
    TranslocoPipe,
    LucideUtensils,
    LucideTarget,
    LucideClipboardList,
  ],
  templateUrl: './onboarding-guide.component.html',
  styleUrl: './onboarding-guide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingGuideComponent {
  protected readonly onboarding = inject(OnboardingService);

  protected onOpenChange(open: boolean): void {
    if (!open) this.onboarding.dismiss();
  }
}
