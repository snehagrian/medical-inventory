import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../pages/services/auth.service';
import { InactivityService } from '../../pages/services/inactivity.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css'
})
export class AppShell implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  showInactivityWarning = false;
  inactivitySecondsLeft = 0;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly inactivityService: InactivityService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inactivityService.showWarning$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showInactivityWarning = true;
      this.cdr.detectChanges();
    });

    this.inactivityService.hideWarning$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showInactivityWarning = false;
      this.cdr.detectChanges();
    });

    this.inactivityService.tick$.pipe(takeUntil(this.destroy$)).subscribe((seconds) => {
      this.inactivitySecondsLeft = seconds;
      this.cdr.detectChanges();
    });

    this.inactivityService.sessionExpired$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.showInactivityWarning = false;
      this.logout();
    });

    this.inactivityService.start();
  }

  ngOnDestroy(): void {
    this.inactivityService.stop();
    this.destroy$.next();
    this.destroy$.complete();
  }

  stayLoggedIn(): void {
    this.showInactivityWarning = false;
    this.inactivityService.stayLoggedIn();
  }

  logout(): void {
    this.authService.clearToken();
    this.router.navigate(['/']);
  }
}
