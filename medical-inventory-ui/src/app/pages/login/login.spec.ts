import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Login } from './login';
import { AuthService } from '../services/auth.service';
import { routes } from '../../app.routes';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: AuthService;
  let router: Router;

  const mockAuthService = {
    login: vi.fn(),
    getToken: vi.fn(),
    saveToken: vi.fn(),
    clearToken: vi.fn(),
    isLoggedIn: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideRouter(routes),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should not call login when form is invalid', () => {
    component.loginForm.setValue({ username: '', password: '' });

    component.onLogin();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login with form credentials on valid submit', () => {
    mockAuthService.login.mockReturnValue(of({ message: 'Login Successful', token: 'fake-token' }));
    component.loginForm.setValue({ username: 'alice', password: 'password123' });

    component.onLogin();

    expect(authService.login).toHaveBeenCalledWith('alice', 'password123');
  });

  it('should navigate to /dashboard on successful login', async () => {
    mockAuthService.login.mockReturnValue(of({ message: 'Login Successful', token: 'fake-token' }));
    component.loginForm.setValue({ username: 'alice', password: 'password123' });
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onLogin();

    expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set errorMessage on login failure', () => {
    mockAuthService.login.mockReturnValue(throwError(() => new Error('Unauthorized')));
    component.loginForm.setValue({ username: 'alice', password: 'wrongpass' });

    component.onLogin();

    expect(component.errorMessage).toBe('Invalid username or password');
  });
});
