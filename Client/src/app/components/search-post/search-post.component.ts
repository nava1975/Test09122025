import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BulletinPostFilter, PostStatus } from 'src/app/models/bulletin-post.model';
import { ApiService } from 'src/app/services/api.service';
import { BulletinPost } from 'src/app/models/bulletin-post.model';

@Component({
  selector: 'app-search-post',
  templateUrl: './search-post.component.html',
  styleUrls: ['./search-post.component.css']
})
export class SearchPostComponent implements OnInit {
  searchForm: FormGroup;
  @Output() searchResults = new EventEmitter<BulletinPost[]>();
  @Output() clearFilter = new EventEmitter<void>();
  statusList = Object.values(PostStatus);
  isLocating = false;
  locationError: string | null = null;
  userLatitude: number | null = null;
  userLongitude: number | null = null;
  locationDetected = false;
  detectedAddress: string = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService
  ) {
    this.searchForm = this.fb.group({
      searchText: [''],
      category: [''],
      subCategory: [''],
      city: [''],
      area: [''],
      address: [''],
      minPrice: [null],
      maxPrice: [null],
      status: [''],
      fromDate: [''],
      toDate: [''],
      radiusKm: [5]
    });
  }

  ngOnInit(): void {}

  /**
   * Use Geolocation API to get user's current location
   */
  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.locationError = 'הדפדפן שלך אינו תומך באיתור מיקום';
      return;
    }

    this.isLocating = true;
    this.locationError = null;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.reverseGeocode(latitude, longitude);
      },
      (error) => {
        this.isLocating = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'נדחתה הרשאה לגישה למיקום';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError = 'מידע המיקום אינו זמין';
            break;
          case error.TIMEOUT:
            this.locationError = 'פג תוקף בקשת המיקום';
            break;
          default:
            this.locationError = 'שגיאה באיתור המיקום';
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Convert coordinates to city and area using reverse geocoding
   */
  private reverseGeocode(latitude: number, longitude: number): void {
    // Using Nominatim (OpenStreetMap) reverse geocoding API
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=he`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.isLocating = false;
        
        if (data && data.address) {
          // Save coordinates
          this.userLatitude = latitude;
          this.userLongitude = longitude;
          this.locationDetected = true;

          // Build full address
          const address = data.address;
          const parts = [];
          
          if (address.road) parts.push(address.road);
          if (address.house_number) parts.push(address.house_number);
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (address.city || address.town || address.village) {
            parts.push(address.city || address.town || address.village);
          }
          
          this.detectedAddress = parts.length > 0 ? parts.join(', ') : 'מיקום אותר בהצלחה';

          console.log('Location detected:', { latitude, longitude, address: this.detectedAddress });
        } else {
          this.locationError = 'לא ניתן לזהות את המיקום';
        }
      })
      .catch(error => {
        this.isLocating = false;
        this.locationError = 'שגיאה בזיהוי המיקום';
        console.error('Reverse geocoding error:', error);
      });
  }

  onSearch(): void {
    const formValue = this.searchForm.value;
    const filter: BulletinPostFilter = {};

    console.log("here search");
    if (formValue.searchText?.trim()) filter.searchText = formValue.searchText.trim();
    if (formValue.category?.trim()) filter.category = formValue.category.trim();
    if (formValue.subCategory?.trim()) filter.subCategory = formValue.subCategory.trim();
    if (formValue.city?.trim()) filter.city = formValue.city.trim();
    if (formValue.area?.trim()) filter.area = formValue.area.trim();
    if (formValue.address?.trim()) filter.address = formValue.address.trim();
    if (formValue.minPrice) filter.minPrice = formValue.minPrice;
    if (formValue.maxPrice) filter.maxPrice = formValue.maxPrice;
    if (formValue.status) filter.status = formValue.status;
    if (formValue.fromDate) filter.fromDate = formValue.fromDate;
    if (formValue.toDate) filter.toDate = formValue.toDate;
    
    // Add location-based search if detected
    if (this.locationDetected && this.userLatitude && this.userLongitude) {
      filter.latitude = this.userLatitude;
      filter.longitude = this.userLongitude;
      filter.radiusKm = formValue.radiusKm || 5;
    }

    this.api.searchPosts(filter).subscribe({
      next: (results) => {
        this.searchResults.emit(results);
      },
      error: (err) => {
        console.error('Error searching posts', err);
      }
    });
  }

  onClear(): void {
    this.searchForm.reset({
      searchText: '',
      category: '',
      subCategory: '',
      city: '',
      area: '',
      address: '',
      minPrice: null,
      maxPrice: null,
      status: '',
      fromDate: '',
      toDate: '',
      radiusKm: 5
    });
    this.userLatitude = null;
    this.userLongitude = null;
    this.locationDetected = false;
    this.locationError = null;
    this.detectedAddress = '';
    this.clearFilter.emit();
  }
}
