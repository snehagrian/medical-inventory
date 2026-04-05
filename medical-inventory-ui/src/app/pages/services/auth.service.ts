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

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
