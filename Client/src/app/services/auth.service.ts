import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, UserDto, UpdateProfileRequest } from '../models/auth.model';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'marketbourd_token';
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { 
    // Load user on service init if token exists
    if (this.isLoggedIn()) {
      this.loadCurrentUser();
    }
  }

  private loadCurrentUser(): void {
    this.getCurrentUser().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.currentUserSubject.next(null)
    });
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/auth/login`, request).pipe(
      tap(res => {
        if (res?.token) {
          localStorage.setItem(this.tokenKey, res.token);
          if (res.user) {
            this.currentUserSubject.next(res.user);
          } else {
            this.loadCurrentUser();
          }
        }
      })
    );
  }

  register(request: RegisterRequest): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/api/auth/register`, request);
  }

  getCurrentUser(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/api/auth/me`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/api/auth/profile`, request).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  uploadProfileImage(file: File): Observable<UserDto> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<UserDto>(`${this.apiUrl}/api/auth/profile/image`, formData).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
