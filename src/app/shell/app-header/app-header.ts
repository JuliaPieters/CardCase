import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

// Navigatie-items groeien mee met de domeinen die daadwerkelijk bestaan — zie
// docs/exec-plans/active/02-full-v1-site.md "Beslissingen tijdens uitvoering" (geen dode
// links naar nog niet gebouwde schermen).
interface NavLink {
  label: string;
  path: string;
}

@Component({
  imports: [RouterLink, RouterLinkActive, ThemeToggle],
  selector: 'app-header',
  styleUrl: './app-header.scss',
  templateUrl: './app-header.html',
})
export class AppHeader {
  protected readonly navLinks: NavLink[] = [{ label: 'Zoeken', path: '/' }];
}
