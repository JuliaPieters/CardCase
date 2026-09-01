import { Component, inject } from '@angular/core';
import { ThemeService } from '../theme.service';

@Component({
  imports: [],
  selector: 'app-theme-toggle',
  styleUrl: './theme-toggle.scss',
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);
}
