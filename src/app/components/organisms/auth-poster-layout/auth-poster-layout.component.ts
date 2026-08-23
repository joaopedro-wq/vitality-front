import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSelectorComponent } from '../../molecules/language-selector/language-selector.component';

@Component({
  selector: 'vtp-auth-poster-layout',
  standalone: true,
  imports: [LanguageSelectorComponent, RouterLink],
  templateUrl: './auth-poster-layout.component.html',
  styleUrl: './auth-poster-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPosterLayoutComponent {}
