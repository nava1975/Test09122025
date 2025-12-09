import { Component, OnInit } from '@angular/core';
import { ApiService, WeatherForecast } from './services/api.service';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Client';
  weatherData: WeatherForecast[] = [];
  loading = false;
  error = '';

  constructor(private apiService: ApiService, public authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.loadWeatherData();
  }

  loadWeatherData(): void {
    this.loading = true;
    this.error = '';
    this.apiService.getWeatherForecast().subscribe({
      next: (data) => {
        this.weatherData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load weather data: ' + err.message;
        this.loading = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
