import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return a valid non-expired token', () => {
    const token = createToken(Math.floor(Date.now() / 1000) + 3600);
    localStorage.setItem('auth_token', token);

    expect(service.getToken()).toBe(token);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should clear and reject an expired token', () => {
    const token = createToken(Math.floor(Date.now() / 1000) - 3600);
    localStorage.setItem('auth_token', token);

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should clear and reject a malformed token', () => {
    localStorage.setItem('auth_token', 'not-a-jwt');

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should persist and return a remembered username', () => {
    service.rememberUsername('alice');

    expect(service.getRememberedUsername()).toBe('alice');
  });

  it('should clear a remembered username', () => {
    service.rememberUsername('alice');

    service.clearRememberedUsername();

    expect(service.getRememberedUsername()).toBe('');
  });
});

function createToken(exp: number): string {
  return `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment({ exp })}.signature`;
}

function encodeSegment(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
