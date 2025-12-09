import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BulletinPost, PostStatus } from 'src/app/models/bulletin-post.model';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-post-details',
  templateUrl: './post-details.component.html',
  styleUrls: ['./post-details.component.css']
})
export class PostDetailsComponent implements OnInit, OnDestroy {
  postForm!: FormGroup;
  imagePreview?: string | null = null;
  selectedFile?: File | null = null;
  mode: 'create' | 'edit' = 'create';
  statusList = Object.values(PostStatus);
  isGeocodingInProgress: boolean = false;
  geocodingMessage: string = '';
  geocodingSuccess: boolean = false;
  private geocodeTimeout: any = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<PostDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode?: 'create' | 'edit', post?: BulletinPost, currentUser?: any }
  ) { }

  ngOnInit(): void {
    // Initialize form
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      subCategory: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      status: [PostStatus.Active, Validators.required],
      location: this.fb.group({
        city: ['', Validators.required],
        area: [''],
        street: [''],
        latitude: [null],
        longitude: [null]
      }),
      ownerName: ['', Validators.required],
      phone1: ['', Validators.required],
      phone2: [''],
      imageUrl: [''],
      description: ['']
    });

    // Create / Edit mode from Dialog data
    if (this.data?.mode === 'edit' && this.data.post) {
      this.mode = 'edit';
      this.patchFormFromPost(this.data.post);
    } else {
      this.mode = 'create';
      // Auto-fill user info if creating new post and user is logged in
      if (this.data?.currentUser) {
        this.postForm.patchValue({
          ownerName: this.data.currentUser.fullName || this.data.currentUser.username,
          phone1: this.data.currentUser.phone || ''
        });
      }
    }
  }

  private patchFormFromPost(post: BulletinPost) {
    this.postForm.patchValue({
      title: post.title,
      category: post.category,
      subCategory: post.subCategory,
      price: post.price,
      status: post.status,
      location: {
        city: post.location?.city || '',
        area: post.location?.area || '',
        street: post.location?.street || '',
        latitude: post.location?.latitude || null,
        longitude: post.location?.longitude || null
      },
      ownerName: post.ownerName,
      phone1: post.phone1,
      phone2: post.phone2,
      imageUrl: post.imageUrl || '',
      description: post.description || ''
    });

    if (post.imageUrl) {
      this.imagePreview = post.imageUrl;
    }
  }

onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  this.selectedFile = input.files[0];

  const reader = new FileReader();
  reader.onload = () => this.imagePreview = reader.result as string;
  reader.readAsDataURL(this.selectedFile);
}



removeImage() {
  this.selectedFile = null;
  this.imagePreview = null;
  this.postForm.patchValue({ imageUrl: '' });
}
 async onSave() {
    if (this.postForm.invalid) return;

    const value = this.postForm.value;
    const formData = new FormData();

    formData.append('Title', value.title);
    formData.append('Category', value.category);
    formData.append('SubCategory', value.subCategory || '');
    formData.append('Price', String(value.price));
    formData.append('Status', value.status);
    formData.append('LocationCity', value.location.city || '');
    formData.append('LocationArea', value.location.area || '');
    formData.append('LocationStreet', value.location.street || '');
    
    // Geocode address if coordinates not already set
    if (!value.location.latitude || !value.location.longitude) {
      await this.geocodeAddress(value.location, formData);
    } else {
      formData.append('LocationLatitude', String(value.location.latitude));
      formData.append('LocationLongitude', String(value.location.longitude));
    }
    
    formData.append('OwnerName', value.ownerName);
    formData.append('Phone1', value.phone1);
    formData.append('Phone2', value.phone2 || '');
    formData.append('Description', value.description || '');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    if (this.mode === 'create') {
      this.api.createPost(formData).subscribe({
        next: (res) => this.dialogRef.close(res),
        error: (err) => {
          console.error('Create post error', err);
          alert('שגיאה ביצירת מודעה: ' + (err.error?.message || err.message));
        }
      });
    } else if (this.mode === 'edit' && this.data.post) {
      this.api.updatePost(this.data.post.id, formData).subscribe({
        next: (res) => this.dialogRef.close(res),
        error: (err) => {
          console.error('Update post error', err);
          alert('שגיאה בעדכון מודעה: ' + (err.error?.message || err.message));
        }
      });
    }
  }
onCancel() {
  this.dialogRef.close();
}

  /**
   * Called when address field changes - triggers auto geocoding after delay
   */
  onAddressFieldChange(): void {
    // Cancel previous timeout if exists
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }

    const locationGroup = this.postForm.get('location');
    const city = locationGroup?.get('city')?.value;
    const street = locationGroup?.get('street')?.value;

    // Check if we have enough address info
    if (!city && !street) {
      this.geocodingMessage = '';
      this.geocodingSuccess = false;
      return;
    }

    // Wait 1000ms after user stops typing
    this.geocodeTimeout = setTimeout(() => {
      this.performGeocoding();
    }, 1000);
  }

  /**
   * Search address on map and update coordinates (manual trigger)
   */
  async searchAddressOnMap(): Promise<void> {
    this.performGeocoding();
  }

  /**
   * Perform the actual geocoding
   */
  private async performGeocoding(): Promise<void> {
    const locationGroup = this.postForm.get('location');
    const city = locationGroup?.get('city')?.value;
    const area = locationGroup?.get('area')?.value;
    const street = locationGroup?.get('street')?.value;

    if (!city && !street) {
      this.geocodingMessage = 'יש להזין לפחות עיר או כתובת';
      this.geocodingSuccess = false;
      return;
    }

    const addressParts = [street, area, city].filter(part => part && part.trim());
    const fullAddress = addressParts.join(', ');
    
    this.isGeocodingInProgress = true;
    this.geocodingMessage = '🌍 מחפש מיקום...';
    this.geocodingSuccess = false;

    try {
      const coords = await this.geocodeAddressToCoords(fullAddress);
      
      if (coords) {
        locationGroup?.patchValue({
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        this.geocodingMessage = '✓ מיקום נמצא';
        this.geocodingSuccess = true;
      } else {
        this.geocodingMessage = 'לא נמצאה כתובת במפה. נסה כתובת אחרת.';
        this.geocodingSuccess = false;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      this.geocodingMessage = 'שגיאה בחיפוש כתובת. נסה שוב.';
      this.geocodingSuccess = false;
    }

    this.isGeocodingInProgress = false;
  }

  /**
   * Geocode address string to coordinates using OpenStreetMap Nominatim API
   */
  private async geocodeAddressToCoords(address: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!address || address.trim() === '') {
      return null;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&accept-language=he&limit=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        return {
          latitude: lat,
          longitude: lon
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode address to get coordinates using OpenStreetMap Nominatim API
   */
  private async geocodeAddress(location: any, formData: FormData): Promise<void> {
    // Build address string
    const addressParts = [
      location.street,
      location.area,
      location.city
    ].filter(part => part && part.trim());
    
    if (addressParts.length === 0) {
      return; // No address to geocode
    }

    const address = addressParts.join(', ');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&accept-language=he&limit=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        formData.append('LocationLatitude', String(lat));
        formData.append('LocationLongitude', String(lon));
        
        console.log(`Geocoded address: ${address} -> (${lat}, ${lon})`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Continue without coordinates
    }
  }

  ngOnDestroy(): void {
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }
  }
  
}
