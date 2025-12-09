export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  role?: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  address?: string;
}

export interface LoginResponse {
  token: string;
  user?: UserDto;
}
