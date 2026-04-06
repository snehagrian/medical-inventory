import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuthResponse {
  message: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private readonly tokenKey = 'auth_token';
  private readonly rememberedUsernameKey = 'remembered_username';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { username, password }).pipe(
      tap(response => this.saveToken(response.token))
    );
  }

  register(username: string, password: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/register`, { username, password }, { responseType: 'text' });
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  rememberUsername(username: string): void {
    localStorage.setItem(this.rememberedUsernameKey, username);
  }

  getRememberedUsername(): string {
    return localStorage.getItem(this.rememberedUsernameKey) ?? '';
  }

  clearRememberedUsername(): void {
    localStorage.removeItem(this.rememberedUsernameKey);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.clearToken();
      return null;
    }

    return token;
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);

    if (!payload || typeof payload.exp !== 'number') {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  }

  private decodeTokenPayload(token: string): { exp?: number } | null {
    const segments = token.split('.');

    if (segments.length !== 3) {
      return null;
    }

    try {
      const base64 = segments[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(segments[1].length / 4) * 4, '=');

      return JSON.parse(atob(base64)) as { exp?: number };
    } catch {
      return null;
    }
  }
}
