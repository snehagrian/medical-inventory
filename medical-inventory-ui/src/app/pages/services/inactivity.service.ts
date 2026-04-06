import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // warn at 25 minutes
const WARNING_AT_MS = IDLE_TIMEOUT_MS - WARNING_BEFORE_MS;

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

@Injectable({ providedIn: 'root' })
export class InactivityService {
  readonly showWarning$ = new Subject<void>();
  readonly hideWarning$ = new Subject<void>();
  readonly sessionExpired$ = new Subject<void>();
  readonly tick$ = new Subject<number>();

  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private warningSecondsLeft = 0;
  private running = false;

  private readonly boundReset = (): void => this.ngZone.run(() => this.onActivity());

  constructor(private readonly ngZone: NgZone) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, this.boundReset, { passive: true }));
    this.schedule();
  }

  stop(): void {
    this.running = false;
    ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, this.boundReset));
    this.clearAll();
  }

  stayLoggedIn(): void {
    this.clearAll();
    this.hideWarning$.next();
    this.schedule();
  }

  private onActivity(): void {
    if (!this.running) return;
    // Only reset if the warning is not yet showing — once warning is up,
    // activity alone does not reset; user must click "Stay logged in"
    if (this.warningSecondsLeft <= 0) {
      this.clearAll();
      this.schedule();
    }
  }

  private schedule(): void {
    this.warningSecondsLeft = 0;

    this.warningTimer = setTimeout(() => {
      this.warningSecondsLeft = WARNING_BEFORE_MS / 1000;
      this.showWarning$.next();
      this.startCountdown();
    }, WARNING_AT_MS);

    this.logoutTimer = setTimeout(() => {
      this.clearAll();
      this.sessionExpired$.next();
    }, IDLE_TIMEOUT_MS);
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.warningSecondsLeft = Math.max(0, this.warningSecondsLeft - 1);
      this.tick$.next(this.warningSecondsLeft);
    }, 1000);
  }

  private clearAll(): void {
    if (this.warningTimer !== null) { clearTimeout(this.warningTimer); this.warningTimer = null; }
    if (this.logoutTimer !== null) { clearTimeout(this.logoutTimer); this.logoutTimer = null; }
    if (this.countdownInterval !== null) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    this.warningSecondsLeft = 0;
  }
}
