import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { AppShell } from './app-shell';
import { AuthService } from '../../pages/services/auth.service';
import { InactivityService } from '../../pages/services/inactivity.service';

describe('AppShell', () => {
  let component: AppShell;
  let fixture: ComponentFixture<AppShell>;
  let authService: AuthService;
  let router: Router;

  const mockAuthService = {
    clearToken: vi.fn()
  };

  const mockInactivityService = {
    showWarning$: new Subject<void>(),
    hideWarning$: new Subject<void>(),
    sessionExpired$: new Subject<void>(),
    tick$: new Subject<number>(),
    start: vi.fn(),
    stop: vi.fn(),
    stayLoggedIn: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: InactivityService, useValue: mockInactivityService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppShell);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should start inactivity tracking on init', () => {
    expect(mockInactivityService.start).toHaveBeenCalled();
  });

  it('should clear token and navigate to / on logout', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.logout();

    expect(authService.clearToken).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/']);
  });
});
