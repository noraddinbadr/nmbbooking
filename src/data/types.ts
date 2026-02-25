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
  // Shift-based scheduling
  shifts: DoctorShift[];
  // Pricing & social responsibility
  freeCasesPerShift: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
}

/** A doctor's work period (فترة) — flexible, not rigid time slots */
export interface DoctorShift {
  id: string;
  label: string; // e.g. "الفترة الصباحية"
  startTime: string; // "09:00"
  endTime: string;   // "13:00"
  daysOfWeek: number[]; // 0=Sun..6=Sat
  // Optional capacity & duration settings
  enableSlotGeneration: boolean;
  consultationDurationMin?: number; // e.g. 15, 20, 30
  maxCapacity?: number; // hard limit per shift
}

/** A generated or manual slot within a shift */
export interface TimeSlot {
  id: string;
  doctorId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingType: BookingType;
  queuePosition?: number; // for flexible (no-slot) mode
}

export type BookingType = 'clinic' | 'hospital' | 'home' | 'video' | 'voice' | 'lab';

export interface Booking {
  id: string;
  patientName: string;
  doctorId: string;
  slotId: string;
  shiftId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  finalPrice: number;
  fundingAmount: number;
  isFreeCase: boolean;
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

// ============ RBAC Types ============
export type StaffRole = 'doctor' | 'assistant' | 'receptionist';

export interface StaffMember {
  id: string;
  userId: string;
  clinicId: string;
  nameAr: string;
  role: StaffRole;
  permissions: StaffPermissions;
  isActive: boolean;
}

export interface StaffPermissions {
  canViewPatients: boolean;
  canEditPatients: boolean;
  canManageBookings: boolean;
  canPrescribe: boolean;
  canOrderLabs: boolean;
  canOrderImaging: boolean;
  canCheckIn: boolean;
  canViewReports: boolean;
  canManageStaff: boolean;
  canManageSettings: boolean;
  canManageEvents: boolean;
  canExportData: boolean;
}

export const defaultPermissionsByRole: Record<StaffRole, StaffPermissions> = {
  doctor: {
    canViewPatients: true, canEditPatients: true, canManageBookings: true,
    canPrescribe: true, canOrderLabs: true, canOrderImaging: true,
    canCheckIn: true, canViewReports: true, canManageStaff: true,
    canManageSettings: true, canManageEvents: true, canExportData: true,
  },
  assistant: {
    canViewPatients: true, canEditPatients: true, canManageBookings: true,
    canPrescribe: false, canOrderLabs: true, canOrderImaging: true,
    canCheckIn: true, canViewReports: false, canManageStaff: false,
    canManageSettings: false, canManageEvents: false, canExportData: false,
  },
  receptionist: {
    canViewPatients: true, canEditPatients: false, canManageBookings: true,
    canPrescribe: false, canOrderLabs: false, canOrderImaging: false,
    canCheckIn: true, canViewReports: false, canManageStaff: false,
    canManageSettings: false, canManageEvents: false, canExportData: false,
  },
};

export const staffRoleLabels: Record<StaffRole, { ar: string; en: string }> = {
  doctor: { ar: 'طبيب', en: 'Doctor' },
  assistant: { ar: 'مساعد', en: 'Assistant' },
  receptionist: { ar: 'موظف استقبال', en: 'Receptionist' },
};
