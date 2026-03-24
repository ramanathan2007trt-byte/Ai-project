export interface UserLocation {
  lat: number;
  lng: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  location?: UserLocation;
  address?: string;
  role: 'user' | 'admin';
  createdAt: any;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: 'electrician' | 'plumber' | 'ac' | 'fridge';
  location: UserLocation;
  currentLocation?: UserLocation;
  experience?: number;
  basePrice: number;
  rating?: number;
  totalJobs?: number;
  online: boolean;
  isBusy?: boolean;
  verified: boolean;
  distance?: number;
  createdAt: any;
}

export interface Booking {
  id: string;
  userId: string;
  technicianId: string;
  category: string;
  date: string;
  time: string;
  address?: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  companyFee?: number;
  technicianEarnings?: number;
  distance: number;
  paymentStatus: 'paid' | 'pending' | 'unpaid';
  paymentMethod?: 'Credit Card' | 'Debit Card' | 'Cash on Delivery';
  cancellationReason?: string;
  timeConsumed?: number;
  finalCost?: number;
  isFake?: boolean;
  fakeReason?: string;
  hasFeedback?: boolean;
  createdAt: any;
}

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  technicianId: string;
  rating: number;
  comment?: string;
  createdAt: any;
}
