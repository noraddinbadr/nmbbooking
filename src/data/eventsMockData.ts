import type {
  MedicalCamp, EventSchedule, Registration, MedicalCase,
  Donation, Provider, ProviderOrder, Clinic
} from './eventsTypes';

export const mockClinics: Clinic[] = [
  {
    id: 'clinic-1', nameAr: 'عيادة الأمل', nameEn: 'Al-Amal Clinic',
    city: 'صنعاء', address: 'شارع الزبيري، صنعاء', phone: '01-234567', ownerId: 'dr-1'
  },
  {
    id: 'clinic-2', nameAr: 'مركز الشفاء الطبي', nameEn: 'Al-Shifaa Medical Center',
    city: 'عدن', address: 'شارع المعلا، عدن', phone: '02-345678', ownerId: 'dr-2'
  },
];

export const mockCamps: MedicalCamp[] = [
  {
    id: 'camp-1',
    titleAr: 'مخيم صنعاء الطبي المجاني',
    titleEn: 'Sanaa Free Medical Camp',
    descriptionAr: 'مخيم طبي مجاني يقدم خدمات القلب والباطنية والعيون لأكثر من 200 مريض',
    descriptionEn: 'Free medical camp providing cardiology, internal medicine, and eye care for 200+ patients',
    clinicId: 'clinic-1',
    organizerId: 'dr-1',
    locationName: 'مدرسة الكويت',
    locationCity: 'صنعاء',
    status: 'published',
    startDate: '2026-03-15',
    endDate: '2026-03-17',
    totalCapacity: 200,
    services: ['cardiology', 'internal', 'ophthalmology'],
    sponsors: [
      { name: 'مؤسسة الخير', tier: 'gold' },
      { name: 'شركة يمن فارما', tier: 'silver' },
    ],
    isFree: true,
    targetFund: 500000,
    raisedFund: 320000,
    createdAt: '2026-02-20',
  },
  {
    id: 'camp-2',
    titleAr: 'مخيم عدن لطب العيون',
    titleEn: 'Aden Eye Care Camp',
    descriptionAr: 'مخيم متخصص في جراحات العيون المجانية وتوزيع النظارات الطبية',
    clinicId: 'clinic-2',
    organizerId: 'dr-2',
    locationName: 'مستشفى الصداقة',
    locationCity: 'عدن',
    status: 'published',
    startDate: '2026-04-01',
    endDate: '2026-04-02',
    totalCapacity: 100,
    services: ['ophthalmology'],
    sponsors: [{ name: 'جمعية النور', tier: 'gold' }],
    isFree: true,
    targetFund: 200000,
    raisedFund: 150000,
    createdAt: '2026-02-22',
  },
];

export const mockSchedules: EventSchedule[] = [
  { id: 'sched-1', campId: 'camp-1', scheduleDate: '2026-03-15', startTime: '08:00', endTime: '12:00', serviceType: 'cardiology', totalSlots: 30, availableSlots: 12 },
  { id: 'sched-2', campId: 'camp-1', scheduleDate: '2026-03-15', startTime: '13:00', endTime: '17:00', serviceType: 'ophthalmology', totalSlots: 25, availableSlots: 25 },
  { id: 'sched-3', campId: 'camp-1', scheduleDate: '2026-03-16', startTime: '08:00', endTime: '12:00', serviceType: 'internal', totalSlots: 30, availableSlots: 30 },
  { id: 'sched-4', campId: 'camp-2', scheduleDate: '2026-04-01', startTime: '09:00', endTime: '15:00', serviceType: 'ophthalmology', totalSlots: 50, availableSlots: 22 },
];

export const mockRegistrations: Registration[] = [
  {
    id: 'reg-1', campId: 'camp-1', scheduleId: 'sched-1', bookedBy: 'user-1',
    patientInfo: { name: 'أحمد محمد', phone: '777111222', gender: 'male', age: 45 },
    status: 'confirmed', caseCode: 'C-a1b2c3d4', createdAt: '2026-02-24T10:00:00Z',
  },
  {
    id: 'reg-2', campId: 'camp-1', scheduleId: 'sched-1', bookedBy: 'user-2',
    patientInfo: { name: 'فاطمة علي', phone: '777333444', gender: 'female', age: 32 },
    status: 'confirmed', caseCode: 'C-e5f6g7h8', createdAt: '2026-02-24T10:30:00Z',
  },
  {
    id: 'reg-3', campId: 'camp-2', scheduleId: 'sched-4', bookedBy: 'user-1',
    patientInfo: { name: 'أحمد محمد', phone: '777111222', gender: 'male', age: 45 },
    status: 'held', holdToken: 'tok-abc-123', holdExpiresAt: '2026-02-24T15:05:00Z',
    caseCode: 'C-i9j0k1l2', createdAt: '2026-02-24T15:00:00Z',
  },
];

export const mockCases: MedicalCase[] = [
  {
    id: 'case-1', registrationId: 'reg-1', caseCode: 'C-a1b2c3d4',
    diagnosisSummary: 'ارتفاع ضغط الدم مع ضيق في الشريان التاجي',
    treatmentPlan: 'قسطرة قلبية تشخيصية + أدوية ضغط',
    estimatedCost: 150000, fundedAmount: 80000, status: 'partially_funded',
    isAnonymous: true, patientAge: 45, patientGender: 'male',
    createdBy: 'dr-1', createdAt: '2026-02-24',
  },
  {
    id: 'case-2', registrationId: 'reg-2', caseCode: 'C-e5f6g7h8',
    diagnosisSummary: 'مياه بيضاء على العين اليمنى',
    treatmentPlan: 'عملية إزالة مياه بيضاء + زراعة عدسة',
    estimatedCost: 80000, fundedAmount: 0, status: 'open',
    isAnonymous: true, patientAge: 32, patientGender: 'female',
    createdBy: 'dr-2', createdAt: '2026-02-24',
  },
];

export const mockDonations: Donation[] = [
  {
    id: 'don-1', caseId: 'case-1', donorName: 'محسن كريم',
    amount: 50000, paymentMethod: 'bank_transfer',
    paymentReference: 'BT-2026-001', status: 'verified', createdAt: '2026-02-24',
  },
  {
    id: 'don-2', caseId: 'case-1', donorName: 'مجهول',
    amount: 30000, paymentMethod: 'cash', status: 'received', createdAt: '2026-02-24',
  },
];

export const mockProviders: Provider[] = [
  { id: 'prov-1', nameAr: 'مختبرات الحياة', nameEn: 'Al-Hayat Labs', type: 'lab', contactPhone: '01-555111', isActive: true },
  { id: 'prov-2', nameAr: 'صيدلية الشفاء', nameEn: 'Al-Shifaa Pharmacy', type: 'pharmacy', contactPhone: '01-555222', isActive: true },
];

export const mockProviderOrders: ProviderOrder[] = [
  {
    id: 'ord-1', providerId: 'prov-1', campId: 'camp-1', registrationId: 'reg-1',
    orderType: 'lab_test', orderDetails: { tests: ['CBC', 'Lipid Profile', 'HbA1c'] },
    status: 'sample_taken', createdAt: '2026-02-24',
  },
  {
    id: 'ord-2', providerId: 'prov-2', campId: 'camp-1', registrationId: 'reg-1',
    orderType: 'medicine', orderDetails: { medicines: [{ name: 'أسبرين', qty: 30 }, { name: 'أملوديبين', qty: 30 }] },
    status: 'pending', createdAt: '2026-02-24',
  },
];

// Service type labels (Arabic)
export const serviceLabels: Record<string, string> = {
  cardiology: 'قلب وأوعية',
  ophthalmology: 'عيون',
  internal: 'باطنية',
  general: 'طب عام',
  orthopedics: 'عظام',
  dental: 'أسنان',
  dermatology: 'جلدية',
  pediatrics: 'أطفال',
};

// Status labels (Arabic)
export const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  published: 'منشور',
  active: 'جاري',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  held: 'محجوز مؤقتاً',
  confirmed: 'مؤكد',
  checked_in: 'تم التسجيل',
  expired: 'منتهي',
  open: 'مفتوح',
  funded: 'ممول بالكامل',
  partially_funded: 'ممول جزئياً',
  in_treatment: 'قيد العلاج',
  closed: 'مغلق',
  pledged: 'تعهد',
  received: 'مستلم',
  verified: 'موثق',
  pending: 'قيد الانتظار',
  sample_taken: 'تم أخذ العينة',
  results_uploaded: 'تم رفع النتائج',
  delivered: 'تم التسليم',
};
