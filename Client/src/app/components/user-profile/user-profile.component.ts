import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserDto } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentUser?: UserDto;
  isEditing = false;
  selectedImageFile?: File;
  imagePreview?: string;
  isLoading = false;
  errorMessage?: string;
  successMessage?: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      phone: [''],
      address: ['']
    });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          fullName: user.fullName,
          phone: user.phone || '',
          address: user.address || ''
        });
        this.imagePreview = this.getFullImageUrl(user.profileImageUrl);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'שגיאה בטעינת פרופיל המשתמש';
        this.isLoading = false;
        console.error('Error loading user profile:', error);
      }
    });
  }

  private getFullImageUrl(imageUrl?: string): string | undefined {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${environment.apiUrl}${imageUrl}`;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to current values if canceling
      this.profileForm.patchValue({
        fullName: this.currentUser?.fullName,
        phone: this.currentUser?.phone || '',
        address: this.currentUser?.address || ''
      });
      this.selectedImageFile = undefined;
      this.imagePreview = this.getFullImageUrl(this.currentUser?.profileImageUrl);
    } else {
      // When entering edit mode, make sure to load the current image
      this.imagePreview = this.getFullImageUrl(this.currentUser?.profileImageUrl);
      this.selectedImageFile = undefined;
    }
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    // First update profile info
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (user) => {
        this.currentUser = user;
        
        // If image was selected, upload it
        if (this.selectedImageFile) {
          this.uploadImage();
        } else {
          this.completeUpdate();
        }
      },
      error: (error) => {
        this.errorMessage = 'שגיאה בעדכון הפרופיל';
        this.isLoading = false;
        console.error('Error updating profile:', error);
      }
    });
  }

  private uploadImage(): void {
    if (!this.selectedImageFile) {
      return;
    }

    this.authService.uploadProfileImage(this.selectedImageFile).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.imagePreview = this.getFullImageUrl(user.profileImageUrl);
        this.selectedImageFile = undefined;
        this.completeUpdate();
      },
      error: (error) => {
        this.errorMessage = 'שגיאה בהעלאת התמונה';
        this.isLoading = false;
        console.error('Error uploading image:', error);
      }
    });
  }

  private completeUpdate(): void {
    this.successMessage = 'הפרופיל עודכן בהצלחה';
    this.isLoading = false;
    this.isEditing = false;
    setTimeout(() => {
      this.successMessage = undefined;
    }, 3000);
  }
}
