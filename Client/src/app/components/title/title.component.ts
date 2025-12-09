import {
AfterViewInit,
Component,
ElementRef,
Input,
OnDestroy,
OnInit,
ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserDto } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

declare const L: any; // keep types light to avoid needing @types/leaflet here


@Component({
selector: 'app-title',
templateUrl: './title.component.html',
styleUrls: ['./title.component.css'],
})
export class TitleComponent implements AfterViewInit, OnDestroy, OnInit {

  currentUser?: UserDto;

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() title = "What's good IN THE HOOD!"; // default title
  @Input() subtitle?: string;
  @Input() height = '320px'; // can be overridden by parent
  @Input() initialLat = 32.0853; // default to Tel Aviv center (example)
  @Input() initialLng = 34.7818;
  @Input() initialZoom = 13;

  private map: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user || undefined;
      }
    });
  }

  ngAfterViewInit(): void {
    // create the leaflet map in the background div
    try {
      // If Leaflet is loaded as global L (see angular.json style/script or import dynamic), use it.
      this.map = (window as any).L
        ? (window as any).L.map(this.mapContainer.nativeElement, {
            attributionControl: false,
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            tap: false,
          })
        : null;

      if (this.map) {
        this.map.setView([this.initialLat, this.initialLng], this.initialZoom);

        (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(this.map);

        // subtle animated pan for visual interest (not heavy)
        let direction = 1;
        const panDistance = 0.0008; // small fractional lat/lng shift
        const panInterval = () => {
          if (!this.map) return;
          const center = this.map.getCenter();
          this.map.panTo([
            center.lat + panDistance * direction,
            center.lng + panDistance * -direction,
          ], { animate: true, duration: 6 });
          direction = -direction;
        };
        const id = setInterval(panInterval, 7000);
        // store id on map for cleanup
        (this.map as any)._panIntervalId = id;
      }
    } catch (e) {
      // fail gracefully: no map library available
      console.warn('Leaflet not available; background will be a static styled placeholder.', e);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      const id = (this.map as any)._panIntervalId;
      if (id) clearInterval(id);
      this.map.remove();
      this.map = null;
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  goToProfile(): void {
    this.router.navigate(['/login'], { queryParams: { mode: 'edit' } });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout();
    this.currentUser = undefined;
    this.router.navigate(['/']);
  }

  getProfileImageUrl(profileImageUrl?: string): string {
    if (!profileImageUrl) return '';
    // If already a full URL, return as is
    if (profileImageUrl.startsWith('http://') || profileImageUrl.startsWith('https://')) {
      return profileImageUrl;
    }
    // Otherwise, prepend the API base URL
    return `${environment.apiUrl}${profileImageUrl}`;
  }
}
