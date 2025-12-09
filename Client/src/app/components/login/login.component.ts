import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { LoginResponse, UserDto } from '../../models/auth.model';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isRegisterMode = false;
  isEditMode = false;
  
  // Login form
  loginUsername = '';
  loginPassword = '';
  
  // Register form
  registerUsername = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';
  registerFullName = '';
  registerPhone = '';
  registerAddress = '';
  selectedImageFile?: File;
  imagePreview?: string;
  
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if coming from profile edit
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'edit') {
        // Check if user is logged in
        if (!this.authService.isLoggedIn()) {
          this.errorMessage = 'עליך להתחבר כדי לערוך את הפרופיל';
          this.router.navigate(['/login']);
          return;
        }
        this.isEditMode = true;
        this.isRegisterMode = true;
        this.loadCurrentUserForEdit();
      }
    });
  }

  loadCurrentUserForEdit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.registerUsername = user.username;
        this.registerEmail = user.email;
        this.registerFullName = user.fullName;
        this.registerPhone = user.phone || '';
        this.registerAddress = user.address || '';
        // Load profile image if exists
        if (user.profileImageUrl) {
          this.imagePreview = this.getFullImageUrl(user.profileImageUrl);
        } else {
          this.imagePreview = undefined;
        }
        this.selectedImageFile = undefined;
      },
      error: () => {
        this.errorMessage = 'שגיאה בטעינת פרטי המשתמש';
        this.router.navigate(['/login']);
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

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.clearMessages();
    this.clearForms();
  }

  triggerFileInput() {
    document.getElementById('registerImage')?.click();
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

  onLogin() {
    if (!this.loginUsername || !this.loginPassword) {
      this.errorMessage = 'נא למלא את כל השדות';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.authService.login({
      username: this.loginUsername,
      password: this.loginPassword
    }).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false;
        this.successMessage = 'התחברת בהצלחה!';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'שם משתמש או סיסמה שגויים';
      }
    });
  }

  onRegister() {
    // If in edit mode, call update instead
    if (this.isEditMode) {
      this.updateProfile();
      return;
    }

    if (!this.registerUsername || !this.registerEmail || !this.registerPassword || !this.registerFullName) {
      this.errorMessage = 'נא למלא את כל השדות החובה';
      return;
    }

    if (this.registerPassword !== this.registerConfirmPassword) {
      this.errorMessage = 'הסיסמאות אינן תואמות';
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage = 'הסיסמה חייבת להכיל לפחות 6 תווים';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.authService.register({
      username: this.registerUsername,
      email: this.registerEmail,
      password: this.registerPassword,
      fullName: this.registerFullName,
      phone: this.registerPhone,
      address: this.registerAddress
    }).subscribe({
      next: (response: UserDto) => {
        // Always login after registration to get token
        this.loginAfterRegister();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'שם משתמש או אימייל כבר קיימים';
      }
    });
  }

  private loginAfterRegister(): void {
    // Login to get the token
    this.authService.login({
      username: this.registerUsername,
      password: this.registerPassword
    }).subscribe({
      next: () => {
        // If image was selected, upload it now
        if (this.selectedImageFile) {
          this.authService.uploadProfileImage(this.selectedImageFile!).subscribe({
            next: () => {
              this.completeRegistration();
            },
            error: () => {
              // Even if image upload fails, complete registration
              this.completeRegistration();
            }
          });
        } else {
          this.completeRegistration();
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'הרישום הצליח אך ההתחברות נכשלה. אנא התחבר ידנית.';
      }
    });
  }

  private uploadProfileImageAfterRegister(userId: string): void {
    // This method is no longer used, kept for backward compatibility
    this.loginAfterRegister();
  }

  private completeRegistration(): void {
    this.isLoading = false;
    this.successMessage = 'נרשמת בהצלחה! מעביר למסך הראשי...';
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 1500);
  }

  updateProfile(): void {
    if (!this.registerFullName) {
      this.errorMessage = 'נא למלא שם מלא';
      return;
    }

    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'עליך להתחבר כדי לעדכן את הפרופיל';
      this.isEditMode = false;
      this.isRegisterMode = false;
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    // First update profile info
    this.authService.updateProfile({
      fullName: this.registerFullName,
      phone: this.registerPhone,
      address: this.registerAddress
    }).subscribe({
      next: () => {
        // If image was selected, upload it
        if (this.selectedImageFile) {
          this.authService.uploadProfileImage(this.selectedImageFile).subscribe({
            next: () => {
              this.completeUpdate();
            },
            error: () => {
              this.completeUpdate();
            }
          });
        } else {
          this.completeUpdate();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'שגיאה בעדכון הפרופיל';
      }
    });
  }

  private completeUpdate(): void {
    this.isLoading = false;
    this.successMessage = 'הפרופיל עודכן בהצלחה!';
    // Reload current user to update the display
    this.authService.getCurrentUser().subscribe({
      next: () => {
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: () => {
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  clearForms() {
    this.loginUsername = '';
    this.loginPassword = '';
    this.registerUsername = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.registerConfirmPassword = '';
    this.registerFullName = '';
    this.registerPhone = '';
    this.registerAddress = '';
    this.selectedImageFile = undefined;
    this.imagePreview = undefined;
  }
}
