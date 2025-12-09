export enum PostStatus {
  Active = 'Active',
  Sold = 'Sold',
  Expired = 'Expired',
  Deleted = 'Deleted'
}

export interface LocationInfo {
  city: string;
  area?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
}

export interface BulletinPost {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  price: number;
  imageUrl?: string;
  location: LocationInfo;
  ownerName: string;
  phone1: string;
  phone2?: string;
  description?: string;
  status: PostStatus;
  createdAt: Date;
  createdBy: string;
  profileImageUrl?: string;
}

export interface CreateBulletinPost {
  title: string;
  category: string;
  subCategory?: string;
  price: number;
  imageUrl?: string;
  location: LocationInfo;
  ownerName: string;
  phone1: string;
  phone2?: string;
  description?: string;
}

export interface UpdateBulletinPost {
  title?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  imageUrl?: string;
  location?: LocationInfo;
  ownerName?: string;
  phone1?: string;
  phone2?: string;
  description?: string;
}

export interface BulletinPostFilter {
  searchText?: string;
  category?: string;
  subCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  area?: string;
  address?: string;
  status?: PostStatus;
  fromDate?: string;
  toDate?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}
