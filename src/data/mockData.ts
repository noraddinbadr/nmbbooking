import { Doctor, Specialty, City, TimeSlot, Booking, Review, DoctorShift } from './types';

export const specialties: Specialty[] = [
  { id: 'cardiology', nameAr: 'قلب وأوعية دموية', nameEn: 'Cardiology', icon: '❤️', doctorCount: 45 },
  { id: 'dermatology', nameAr: 'جلدية', nameEn: 'Dermatology', icon: '🧴', doctorCount: 62 },
  { id: 'pediatrics', nameAr: 'أطفال', nameEn: 'Pediatrics', icon: '👶', doctorCount: 89 },
  { id: 'orthopedics', nameAr: 'عظام', nameEn: 'Orthopedics', icon: '🦴', doctorCount: 38 },
  { id: 'ophthalmology', nameAr: 'عيون', nameEn: 'Ophthalmology', icon: '👁️', doctorCount: 52 },
  { id: 'dentistry', nameAr: 'أسنان', nameEn: 'Dentistry', icon: '🦷', doctorCount: 120 },
  { id: 'ent', nameAr: 'أنف وأذن وحنجرة', nameEn: 'ENT', icon: '👂', doctorCount: 34 },
  { id: 'neurology', nameAr: 'مخ وأعصاب', nameEn: 'Neurology', icon: '🧠', doctorCount: 28 },
  { id: 'gynecology', nameAr: 'نساء وتوليد', nameEn: 'Gynecology', icon: '🤰', doctorCount: 67 },
  { id: 'urology', nameAr: 'مسالك بولية', nameEn: 'Urology', icon: '🏥', doctorCount: 31 },
  { id: 'psychiatry', nameAr: 'نفسية', nameEn: 'Psychiatry', icon: '🧘', doctorCount: 19 },
  { id: 'internal', nameAr: 'باطنة', nameEn: 'Internal Medicine', icon: '🩺', doctorCount: 95 },
];

export const cities: City[] = [
  { id: 'sanaa', nameAr: 'صنعاء', nameEn: 'Sanaa' },
  { id: 'aden', nameAr: 'عدن', nameEn: 'Aden' },
  { id: 'taiz', nameAr: 'تعز', nameEn: 'Taiz' },
  { id: 'hodeidah', nameAr: 'الحديدة', nameEn: 'Hodeidah' },
  { id: 'ibb', nameAr: 'إب', nameEn: 'Ibb' },
  { id: 'mukalla', nameAr: 'المكلا', nameEn: 'Mukalla' },
];

// ============ Shared shift definitions ============
const morningShift = (id: string, days: number[], enableSlots: boolean, duration?: number, cap?: number): DoctorShift => ({
  id: `${id}-morning`,
  label: 'الفترة الصباحية',
  startTime: '09:00',
  endTime: '13:00',
  daysOfWeek: days,
  enableSlotGeneration: enableSlots,
  consultationDurationMin: duration,
  maxCapacity: cap,
});

const eveningShift = (id: string, days: number[], enableSlots: boolean, duration?: number, cap?: number): DoctorShift => ({
  id: `${id}-evening`,
  label: 'الفترة المسائية',
  startTime: '16:00',
  endTime: '20:00',
  daysOfWeek: days,
  enableSlotGeneration: enableSlots,
  consultationDurationMin: duration,
  maxCapacity: cap,
});

export const doctors: Doctor[] = [
  {
    id: 'dr-1',
    nameAr: 'د. أحمد محمد العليمي',
    nameEn: 'Dr. Ahmed Al-Alimi',
    specialty: 'cardiology',
    specialtyAr: 'قلب وأوعية دموية',
    city: 'sanaa',
    cityAr: 'صنعاء',
    rating: 4.8,
    totalReviews: 247,
    basePrice: 5000,
    discountPercent: 0,
    isVerified: true,
    profileImage: '',
    gender: 'male',
    yearsExperience: 15,
    aboutAr: 'استشاري أمراض القلب والأوعية الدموية، حاصل على البورد العربي في أمراض القلب. خبرة 15 عاماً في تشخيص وعلاج أمراض القلب.',
    aboutEn: 'Consultant cardiologist with Arab Board certification. 15 years of experience in heart disease diagnosis and treatment.',
    languages: ['العربية', 'English'],
    education: ['بورد عربي - أمراض القلب', 'ماجستير طب القلب - جامعة صنعاء'],
    clinicName: 'Heart Care Center',
    clinicNameAr: 'مركز رعاية القلب',
    clinicAddress: 'شارع الزبيري، صنعاء',
    bookingTypes: ['clinic', 'video'],
    waitTime: '15 دقيقة',
    availableToday: true,
    isSponsored: false,
    freeCasesPerShift: 2,
    discountType: 'none',
    discountValue: 0,
    shifts: [
      morningShift('dr-1', [0, 1, 2, 3, 4], true, 20, 12),
      eveningShift('dr-1', [0, 2, 4], true, 20, 10),
    ],
  },
  {
    id: 'dr-2',
    nameAr: 'د. فاطمة علي الحكيمي',
    nameEn: 'Dr. Fatima Al-Hakimi',
    specialty: 'pediatrics',
    specialtyAr: 'أطفال',
    city: 'sanaa',
    cityAr: 'صنعاء',
    rating: 4.9,
    totalReviews: 512,
    basePrice: 3000,
    discountPercent: 20,
    isVerified: true,
    profileImage: '',
    gender: 'female',
    yearsExperience: 12,
    aboutAr: 'أخصائية طب الأطفال وحديثي الولادة. متخصصة في أمراض الأطفال الشائعة والتطعيمات.',
    aboutEn: 'Pediatrics specialist focusing on common childhood diseases and vaccinations.',
    languages: ['العربية'],
    education: ['ماجستير طب الأطفال - جامعة عدن'],
    clinicName: 'Kids Health Clinic',
    clinicNameAr: 'عيادة صحة الأطفال',
    clinicAddress: 'شارع تعز، صنعاء',
    bookingTypes: ['clinic', 'home', 'video'],
    waitTime: '10 دقائق',
    availableToday: true,
    isSponsored: true,
    freeCasesPerShift: 3,
    discountType: 'percentage',
    discountValue: 20,
    shifts: [
      morningShift('dr-2', [0, 1, 2, 3, 4], false, undefined, 20), // flexible — no slot generation
      eveningShift('dr-2', [0, 1, 3], true, 15, 16),
    ],
  },
  {
    id: 'dr-3',
    nameAr: 'د. عبدالله حسن المقطري',
    nameEn: 'Dr. Abdullah Al-Maqtari',
    specialty: 'orthopedics',
    specialtyAr: 'عظام',
    city: 'aden',
    cityAr: 'عدن',
    rating: 4.7,
    totalReviews: 189,
    basePrice: 4000,
    discountPercent: 10,
    isVerified: true,
    profileImage: '',
    gender: 'male',
    yearsExperience: 20,
    aboutAr: 'استشاري جراحة العظام والمفاصل. خبرة واسعة في جراحات الركبة والكتف.',
    aboutEn: 'Orthopedic surgery consultant specializing in knee and shoulder surgeries.',
    languages: ['العربية', 'English'],
    education: ['زمالة جراحة العظام - القاهرة', 'بورد عربي'],
    clinicName: 'Bone & Joint Center',
    clinicNameAr: 'مركز العظام والمفاصل',
    clinicAddress: 'شارع المعلا، عدن',
    bookingTypes: ['clinic', 'hospital'],
    waitTime: '20 دقيقة',
    availableToday: false,
    isSponsored: false,
    freeCasesPerShift: 1,
    discountType: 'fixed',
    discountValue: 500,
    shifts: [
      morningShift('dr-3', [0, 2, 4], true, 30, 8),
    ],
  },
  {
    id: 'dr-4',
    nameAr: 'د. سارة يحيى الشرعبي',
    nameEn: 'Dr. Sara Al-Sharabi',
    specialty: 'dermatology',
    specialtyAr: 'جلدية',
    city: 'sanaa',
    cityAr: 'صنعاء',
    rating: 4.6,
    totalReviews: 334,
    basePrice: 3500,
    discountPercent: 15,
    isVerified: true,
    profileImage: '',
    gender: 'female',
    yearsExperience: 8,
    aboutAr: 'أخصائية الأمراض الجلدية والتجميل. متخصصة في علاج حب الشباب والأمراض الجلدية المزمنة.',
    aboutEn: 'Dermatology and cosmetics specialist. Expert in acne and chronic skin conditions.',
    languages: ['العربية', 'English'],
    education: ['ماجستير أمراض جلدية - الأردن'],
    clinicName: 'Skin Care Clinic',
    clinicNameAr: 'عيادة العناية بالبشرة',
    clinicAddress: 'حدة، صنعاء',
    bookingTypes: ['clinic', 'video'],
    waitTime: '15 دقيقة',
    availableToday: true,
    isSponsored: false,
    freeCasesPerShift: 1,
    discountType: 'percentage',
    discountValue: 15,
    shifts: [
      morningShift('dr-4', [0, 1, 2, 3, 4], true, 20, 12),
      eveningShift('dr-4', [1, 3], true, 20, 10),
    ],
  },
  {
    id: 'dr-5',
    nameAr: 'د. محمد عبدالرحمن النعمان',
    nameEn: "Dr. Mohammed Al-Nu'man",
    specialty: 'dentistry',
    specialtyAr: 'أسنان',
    city: 'taiz',
    cityAr: 'تعز',
    rating: 4.5,
    totalReviews: 423,
    basePrice: 2500,
    discountPercent: 0,
    isVerified: true,
    profileImage: '',
    gender: 'male',
    yearsExperience: 10,
    aboutAr: 'طبيب أسنان متخصص في تقويم الأسنان وزراعة الأسنان. استخدام أحدث التقنيات.',
    aboutEn: 'Dental specialist in orthodontics and dental implants using latest technology.',
    languages: ['العربية'],
    education: ['بكالوريوس طب أسنان - جامعة تعز', 'دبلوم تقويم أسنان'],
    clinicName: 'Perfect Smile',
    clinicNameAr: 'الابتسامة المثالية',
    clinicAddress: 'شارع جمال، تعز',
    bookingTypes: ['clinic'],
    waitTime: '30 دقيقة',
    availableToday: true,
    isSponsored: true,
    freeCasesPerShift: 2,
    discountType: 'none',
    discountValue: 0,
    shifts: [
      morningShift('dr-5', [0, 1, 2, 3, 4], false, undefined, 15), // flexible
    ],
  },
  {
    id: 'dr-6',
    nameAr: 'د. نورا خالد البيضاني',
    nameEn: 'Dr. Noura Al-Baidani',
    specialty: 'gynecology',
    specialtyAr: 'نساء وتوليد',
    city: 'sanaa',
    cityAr: 'صنعاء',
    rating: 4.9,
    totalReviews: 678,
    basePrice: 4500,
    discountPercent: 0,
    isVerified: true,
    profileImage: '',
    gender: 'female',
    yearsExperience: 18,
    aboutAr: 'استشارية أمراض النساء والتوليد. متخصصة في متابعة الحمل والولادة الطبيعية والقيصرية.',
    aboutEn: 'OB/GYN consultant specializing in pregnancy care and delivery.',
    languages: ['العربية', 'English'],
    education: ['زمالة نساء وتوليد - مصر', 'بورد عربي'],
    clinicName: "Women's Health Center",
    clinicNameAr: 'مركز صحة المرأة',
    clinicAddress: 'شارع الستين، صنعاء',
    bookingTypes: ['clinic', 'hospital', 'video'],
    waitTime: '20 دقيقة',
    availableToday: true,
    isSponsored: false,
    freeCasesPerShift: 3,
    discountType: 'none',
    discountValue: 0,
    shifts: [
      morningShift('dr-6', [0, 1, 2, 3, 4], true, 20, 12),
      eveningShift('dr-6', [0, 2, 4], true, 20, 10),
    ],
  },
];

/**
 * Generate time slots from a doctor's shifts for a given date.
 * If shift.enableSlotGeneration is true and consultationDurationMin is set,
 * it generates fixed time slots. Otherwise, it creates a single "open queue" entry.
 */
export function generateTimeSlots(doctorId: string, date: string): TimeSlot[] {
  const doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) return [];

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const activeShifts = doctor.shifts.filter(s => s.daysOfWeek.includes(dayOfWeek));
  const slots: TimeSlot[] = [];

  for (const shift of activeShifts) {
    if (shift.enableSlotGeneration && shift.consultationDurationMin) {
      // Generate fixed slots based on duration
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const dur = shift.consultationDurationMin;
      let pos = 0;

      for (let m = startMinutes; m + dur <= endMinutes; m += dur) {
        if (shift.maxCapacity && pos >= shift.maxCapacity) break;
        const sH = Math.floor(m / 60);
        const sM = m % 60;
        const eH = Math.floor((m + dur) / 60);
        const eM = (m + dur) % 60;
        const startTime = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
        const endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

        slots.push({
          id: `${doctorId}-${date}-${shift.id}-${pos}`,
          doctorId,
          shiftId: shift.id,
          date,
          startTime,
          endTime,
          isAvailable: Math.random() > 0.3,
          bookingType: 'clinic',
          queuePosition: pos + 1,
        });
        pos++;
      }
    } else {
      // Flexible mode — single entry representing open booking in this shift
      const bookedCount = Math.floor(Math.random() * (shift.maxCapacity || 20));
      const cap = shift.maxCapacity || 999;
      slots.push({
        id: `${doctorId}-${date}-${shift.id}-queue`,
        doctorId,
        shiftId: shift.id,
        date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isAvailable: bookedCount < cap,
        bookingType: 'clinic',
        queuePosition: bookedCount + 1,
      });
    }
  }

  return slots;
}

/** Get the active shifts for a doctor on a specific date */
export function getShiftsForDate(doctorId: string, date: string): DoctorShift[] {
  const doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) return [];
  const dayOfWeek = new Date(date).getDay();
  return doctor.shifts.filter(s => s.daysOfWeek.includes(dayOfWeek));
}

export const reviews: Review[] = [
  { id: 'r1', doctorId: 'dr-1', patientName: 'محمد أ.', rating: 5, comment: 'دكتور ممتاز ومحترف جداً. شرح لي حالتي بالتفصيل.', date: '2026-02-15' },
  { id: 'r2', doctorId: 'dr-1', patientName: 'سعيد ك.', rating: 4, comment: 'خبرة عالية وعلاج فعال. أنصح بزيارته.', date: '2026-02-10' },
  { id: 'r3', doctorId: 'dr-2', patientName: 'أم خالد', rating: 5, comment: 'دكتورة رائعة مع الأطفال. ابني يحبها.', date: '2026-02-18' },
  { id: 'r4', doctorId: 'dr-2', patientName: 'فاطمة ع.', rating: 5, comment: 'أفضل طبيبة أطفال في صنعاء بدون منازع.', date: '2026-02-12' },
  { id: 'r5', doctorId: 'dr-4', patientName: 'ليلى م.', rating: 4, comment: 'علاج ممتاز لمشكلة البشرة. شكراً دكتورة.', date: '2026-02-08' },
  { id: 'r6', doctorId: 'dr-6', patientName: 'أم أحمد', rating: 5, comment: 'متابعة حمل ممتازة. دكتورة محترفة ولطيفة.', date: '2026-02-20' },
];

export const sampleBookings: Booking[] = [
  {
    id: 'b1', patientName: 'علي محمد', doctorId: 'dr-1', slotId: 'dr-1-2026-02-25-dr-1-morning-0',
    shiftId: 'dr-1-morning', status: 'confirmed', finalPrice: 5000, fundingAmount: 0,
    isFreeCase: false, createdAt: '2026-02-20', bookingType: 'clinic',
  },
  {
    id: 'b2', patientName: 'علي محمد', doctorId: 'dr-2', slotId: 'dr-2-2026-02-22-dr-2-evening-2',
    shiftId: 'dr-2-evening', status: 'completed', finalPrice: 2400, fundingAmount: 600,
    isFreeCase: false, createdAt: '2026-02-15', bookingType: 'video',
  },
];

export const bookingTypeLabels: Record<string, { ar: string; en: string; icon: string }> = {
  clinic: { ar: 'عيادة', en: 'Clinic', icon: '🏥' },
  hospital: { ar: 'مستشفى', en: 'Hospital', icon: '🏨' },
  home: { ar: 'زيارة منزلية', en: 'Home Visit', icon: '🏠' },
  video: { ar: 'فيديو', en: 'Video Call', icon: '📹' },
  voice: { ar: 'مكالمة صوتية', en: 'Voice Call', icon: '📞' },
  lab: { ar: 'تحاليل', en: 'Lab Test', icon: '🧪' },
};
