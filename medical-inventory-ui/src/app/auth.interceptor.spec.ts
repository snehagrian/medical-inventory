import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './pages/services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;

  const mockAuthService = {
    getToken: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should not attach Authorization header to auth requests', () => {
    mockAuthService.getToken.mockReturnValue('fake-token');

    http.post('http://localhost:8080/api/auth/register', {}).subscribe();

    const req = httpTestingController.expectOne('http://localhost:8080/api/auth/register');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should attach Authorization header to protected API requests', () => {
    mockAuthService.getToken.mockReturnValue('fake-token');

    http.get('http://localhost:8080/api/items').subscribe();

    const req = httpTestingController.expectOne('http://localhost:8080/api/items');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush({});
  });
});
