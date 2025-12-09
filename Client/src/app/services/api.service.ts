import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  BulletinPost, 
  CreateBulletinPost, 
  UpdateBulletinPost, 
  BulletinPostFilter,
  PostStatus 
} from '../models/bulletin-post.model';

export interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getWeatherForecast(): Observable<WeatherForecast[]> {
    return this.http.get<WeatherForecast[]>(`${this.apiUrl}/weatherforecast`);
  }

  // BulletinPost API Methods

  /**
   * Get all bulletin posts
   */
  getAllPosts(): Observable<BulletinPost[]> {
    return this.http.get<BulletinPost[]>(`${this.apiUrl}/api/bulletinpost`);
  }

  /**
   * Get bulletin post by ID
   */
  getPostById(id: string): Observable<BulletinPost> {
    return this.http.get<BulletinPost>(`${this.apiUrl}/api/bulletinpost/${id}`);
  }

  /**
   * Get posts by category
   */
  getPostsByCategory(category: string): Observable<BulletinPost[]> {
    return this.http.get<BulletinPost[]>(`${this.apiUrl}/api/bulletinpost/category/${encodeURIComponent(category)}`);
  }

  /**
   * Get posts by city
   */
  getPostsByCity(city: string): Observable<BulletinPost[]> {
    return this.http.get<BulletinPost[]>(`${this.apiUrl}/api/bulletinpost/city/${encodeURIComponent(city)}`);
  }

  /**
   * Get posts by status
   */
  getPostsByStatus(status: PostStatus): Observable<BulletinPost[]> {
    return this.http.get<BulletinPost[]>(`${this.apiUrl}/api/bulletinpost/status/${status}`);
  }

  /**
   * Search posts with filters
   */
  searchPosts(filter: BulletinPostFilter): Observable<BulletinPost[]> {
    return this.http.post<BulletinPost[]>(`${this.apiUrl}/api/bulletinpost/search`, filter);
  }

  createPost(form: FormData) {
  return this.http.post<BulletinPost>(`${this.apiUrl}/api/bulletinpost`, form);
}

updatePost(id: string, form: FormData) {
  return this.http.put<BulletinPost>(`${this.apiUrl}/api/bulletinpost/${id}`, form);
}
  /**
   * Delete bulletin post
   */
  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/bulletinpost/${id}`);
  }

  /**
   * Change post status
   */
  changePostStatus(id: string, status: PostStatus): Observable<BulletinPost> {
    return this.http.patch<BulletinPost>(`${this.apiUrl}/api/bulletinpost/${id}/status`, { status });
  }
}
