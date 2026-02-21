export interface Doctor {
  id: string;
  nameAr: string;
  nameEn: string;
  specialty: string;
  specialtyAr: string;
  city: string;
  cityAr: string;
  rating: number;
  totalReviews: number;
  basePrice: number;
  discountPercent: number;
  isVerified: boolean;
  profileImage: string;
  gender: 'male' | 'female';
  yearsExperience: number;
  aboutAr: string;
  aboutEn: string;
  languages: string[];
  education: string[];
  clinicName: string;
  clinicNameAr: string;
  clinicAddress: string;
  bookingTypes: BookingType[];
  waitTime: string;
  availableToday: boolean;
  isSponsored: boolean;
}

export type BookingType = 'clinic' | 'hospital' | 'home' | 'video' | 'voice' | 'lab';

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingType: BookingType;
}

export interface Booking {
  id: string;
  patientName: string;
  doctorId: string;
  slotId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  finalPrice: number;
  fundingAmount: number;
  createdAt: string;
  bookingType: BookingType;
}

export interface Specialty {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  doctorCount: number;
}

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface Review {
  id: string;
  doctorId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}
