import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Signup } from './signup';
import { AuthService } from '../services/auth.service';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authService: AuthService;

  const mockAuthService = {
    register: vi.fn(),
    getToken: vi.fn(),
    saveToken: vi.fn(),
    clearToken: vi.fn(),
    isLoggedIn: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    await fixture.whenStable();
  });

  it('should not call register when form is invalid', () => {
    component.signupForm.setValue({ username: '', password: '' });

    component.onSignup();

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Please fix form errors');
  });

  it('should call authService.register with form values on valid submit', () => {
    mockAuthService.register.mockReturnValue(of('Registration Successful'));
    component.signupForm.setValue({ username: 'alice', password: 'password123' });

    component.onSignup();

    expect(authService.register).toHaveBeenCalledWith('alice', 'password123');
  });

  it('should show success message on successful registration', () => {
    mockAuthService.register.mockReturnValue(of('Registration Successful'));
    component.signupForm.setValue({ username: 'alice', password: 'password123' });

    component.onSignup();

    expect(component.successMessage).toBe('User created successfully!');
  });

  it('should show error message on 409 duplicate username', () => {
    mockAuthService.register.mockReturnValue(throwError(() => ({
      error: { message: 'Username already exists' }
    })));
    component.signupForm.setValue({ username: 'alice', password: 'password123' });

    component.onSignup();

    expect(component.errorMessage).toBe('Username already exists');
  });
});
