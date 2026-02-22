// Dashboard mock data for Doctor Panel

export interface DashboardPatient {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  gender: 'male' | 'female';
  age: number;
  insuranceProvider: string;
  classification: 'regular' | 'emergency' | 'sponsored';
  lastVisit: string;
  totalVisits: number;
}

export interface DashboardAppointment {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  slotTime: string;
  slotDate: string;
  durationMin: number;
  bookingType: 'clinic' | 'home' | 'video' | 'voice';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  price: number;
  fundingAmount: number;
  priority: 'normal' | 'urgent' | 'emergency';
  notes: string;
  classification: 'regular' | 'emergency' | 'sponsored';
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  medicines: { name: string; dosage: string; frequency: string; duration: string; instructions: string }[];
  pharmacySent: boolean;
  createdAt: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  tests: { name: string; category: string }[];
  labPartner: string;
  status: 'ordered' | 'collected' | 'processing' | 'ready';
  resultsUrl: string;
  interpretation: string;
  createdAt: string;
}

export interface TreatmentFile {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  date: string;
  symptoms: string;
  examination: string;
  diagnosis: string;
  followUpDate: string;
  notes: string;
}

export const dashboardPatients: DashboardPatient[] = [
  { id: 'p1', name: 'أحمد محمد علي', phone: '777123456', nationalId: '12345678', gender: 'male', age: 35, insuranceProvider: 'التأمين الوطني', classification: 'regular', lastVisit: '2026-02-20', totalVisits: 5 },
  { id: 'p2', name: 'فاطمة عبدالله حسن', phone: '771234567', nationalId: '23456789', gender: 'female', age: 28, insuranceProvider: '', classification: 'sponsored', lastVisit: '2026-02-18', totalVisits: 3 },
  { id: 'p3', name: 'خالد سعيد الحمدي', phone: '773456789', nationalId: '34567890', gender: 'male', age: 52, insuranceProvider: 'يمن للتأمين', classification: 'regular', lastVisit: '2026-02-15', totalVisits: 12 },
  { id: 'p4', name: 'نورا يحيى المقطري', phone: '774567890', nationalId: '45678901', gender: 'female', age: 42, insuranceProvider: '', classification: 'emergency', lastVisit: '2026-02-22', totalVisits: 1 },
  { id: 'p5', name: 'عمر حسين البيضاني', phone: '775678901', nationalId: '56789012', gender: 'male', age: 19, insuranceProvider: 'التأمين الوطني', classification: 'regular', lastVisit: '2026-02-10', totalVisits: 8 },
  { id: 'p6', name: 'سارة علي الشرعبي', phone: '776789012', nationalId: '67890123', gender: 'female', age: 31, insuranceProvider: '', classification: 'sponsored', lastVisit: '2026-02-21', totalVisits: 2 },
];

export const dashboardAppointments: DashboardAppointment[] = [
  { id: 'a1', patientId: 'p1', patientName: 'أحمد محمد علي', phone: '777123456', slotTime: '09:00', slotDate: '2026-02-22', durationMin: 30, bookingType: 'clinic', status: 'confirmed', price: 5000, fundingAmount: 0, priority: 'normal', notes: 'فحص دوري', classification: 'regular' },
  { id: 'a2', patientId: 'p2', patientName: 'فاطمة عبدالله حسن', phone: '771234567', slotTime: '09:30', slotDate: '2026-02-22', durationMin: 30, bookingType: 'clinic', status: 'confirmed', price: 3000, fundingAmount: 3000, priority: 'normal', notes: '', classification: 'sponsored' },
  { id: 'a3', patientId: 'p4', patientName: 'نورا يحيى المقطري', phone: '774567890', slotTime: '10:00', slotDate: '2026-02-22', durationMin: 30, bookingType: 'clinic', status: 'pending', price: 5000, fundingAmount: 0, priority: 'emergency', notes: 'ألم حاد في الصدر', classification: 'emergency' },
  { id: 'a4', patientId: 'p3', patientName: 'خالد سعيد الحمدي', phone: '773456789', slotTime: '10:30', slotDate: '2026-02-22', durationMin: 30, bookingType: 'video', status: 'pending', price: 4000, fundingAmount: 0, priority: 'normal', notes: 'متابعة علاج', classification: 'regular' },
  { id: 'a5', patientId: 'p5', patientName: 'عمر حسين البيضاني', phone: '775678901', slotTime: '11:00', slotDate: '2026-02-22', durationMin: 30, bookingType: 'clinic', status: 'confirmed', price: 5000, fundingAmount: 0, priority: 'normal', notes: '', classification: 'regular' },
  { id: 'a6', patientId: 'p6', patientName: 'سارة علي الشرعبي', phone: '776789012', slotTime: '11:30', slotDate: '2026-02-22', durationMin: 15, bookingType: 'clinic', status: 'confirmed', price: 3000, fundingAmount: 1500, priority: 'normal', notes: 'فحص أولي', classification: 'sponsored' },
  { id: 'a7', patientId: 'p1', patientName: 'أحمد محمد علي', phone: '777123456', slotTime: '14:00', slotDate: '2026-02-22', durationMin: 30, bookingType: 'clinic', status: 'pending', price: 5000, fundingAmount: 0, priority: 'normal', notes: '', classification: 'regular' },
  { id: 'a8', patientId: 'p3', patientName: 'خالد سعيد الحمدي', phone: '773456789', slotTime: '14:30', slotDate: '2026-02-22', durationMin: 30, bookingType: 'clinic', status: 'pending', price: 5000, fundingAmount: 0, priority: 'urgent', notes: 'تحليل نتائج مخبرية', classification: 'regular' },
  // Past appointments
  { id: 'a9', patientId: 'p1', patientName: 'أحمد محمد علي', phone: '777123456', slotTime: '09:00', slotDate: '2026-02-20', durationMin: 30, bookingType: 'clinic', status: 'completed', price: 5000, fundingAmount: 0, priority: 'normal', notes: 'فحص قلب', classification: 'regular' },
  { id: 'a10', patientId: 'p2', patientName: 'فاطمة عبدالله حسن', phone: '771234567', slotTime: '10:00', slotDate: '2026-02-19', durationMin: 30, bookingType: 'video', status: 'completed', price: 3000, fundingAmount: 3000, priority: 'normal', notes: '', classification: 'sponsored' },
  { id: 'a11', patientId: 'p5', patientName: 'عمر حسين البيضاني', phone: '775678901', slotTime: '15:00', slotDate: '2026-02-18', durationMin: 30, bookingType: 'clinic', status: 'no_show', price: 5000, fundingAmount: 0, priority: 'normal', notes: '', classification: 'regular' },
];

export const dashboardPrescriptions: Prescription[] = [
  {
    id: 'rx1', patientId: 'p1', patientName: 'أحمد محمد علي', appointmentId: 'a9',
    medicines: [
      { name: 'أسبرين', dosage: '100mg', frequency: 'مرة يومياً', duration: '3 أشهر', instructions: 'بعد الأكل' },
      { name: 'أتورفاستاتين', dosage: '20mg', frequency: 'مرة يومياً', duration: '6 أشهر', instructions: 'مساءً قبل النوم' },
    ],
    pharmacySent: true, createdAt: '2026-02-20',
  },
  {
    id: 'rx2', patientId: 'p2', patientName: 'فاطمة عبدالله حسن', appointmentId: 'a10',
    medicines: [
      { name: 'أموكسيسيلين', dosage: '500mg', frequency: '3 مرات يومياً', duration: '7 أيام', instructions: 'قبل الأكل بنصف ساعة' },
    ],
    pharmacySent: false, createdAt: '2026-02-19',
  },
];

export const dashboardLabOrders: LabOrder[] = [
  { id: 'lab1', patientId: 'p1', patientName: 'أحمد محمد علي', tests: [{ name: 'صورة دم كاملة', category: 'blood' }, { name: 'سكر صائم', category: 'sugar' }], labPartner: 'مختبر الأمل', status: 'ready', resultsUrl: '', interpretation: 'النتائج طبيعية', createdAt: '2026-02-18' },
  { id: 'lab2', patientId: 'p3', patientName: 'خالد سعيد الحمدي', tests: [{ name: 'كوليسترول', category: 'cholesterol' }, { name: 'وظائف كبد', category: 'blood' }], labPartner: 'مختبر الصحة', status: 'processing', resultsUrl: '', interpretation: '', createdAt: '2026-02-20' },
  { id: 'lab3', patientId: 'p5', patientName: 'عمر حسين البيضاني', tests: [{ name: 'هرمونات الغدة', category: 'hormones' }], labPartner: 'مختبر الأمل', status: 'ordered', resultsUrl: '', interpretation: '', createdAt: '2026-02-21' },
];

export const dashboardTreatmentFiles: TreatmentFile[] = [
  { id: 'tf1', patientId: 'p1', patientName: 'أحمد محمد علي', appointmentId: 'a9', date: '2026-02-20', symptoms: 'ألم في الصدر عند المجهود', examination: 'ضغط الدم 140/90، نبض منتظم', diagnosis: 'ارتفاع ضغط الدم الأولي', followUpDate: '2026-03-20', notes: 'بدء علاج دوائي ومتابعة بعد شهر' },
  { id: 'tf2', patientId: 'p3', patientName: 'خالد سعيد الحمدي', appointmentId: 'a8', date: '2026-02-15', symptoms: 'إرهاق مستمر وصداع', examination: 'فحص عام طبيعي', diagnosis: 'نقص فيتامين D', followUpDate: '2026-03-15', notes: 'فحص مخبري وعلاج تعويضي' },
];

export const dashboardStats = {
  todayAppointments: { total: 25, completed: 10, remaining: 15, remainingTime: '3 ساعات 20 دقيقة' },
  dailyRevenue: 25000,
  weeklyRevenue: [18000, 22000, 25000, 20000, 28000, 15000, 25000],
  newReviews: { average: 4.8, total: 127, thisWeek: 8 },
  waitingPatients: 3,
  unreadNotifications: 5,
  monthlyStats: {
    patientsTreated: 150,
    totalRevenue: 250000,
    attendanceRate: 92,
    topServices: [
      { name: 'فحص سكر', percentage: 40 },
      { name: 'استشارة عامة', percentage: 30 },
      { name: 'فحص ضغط', percentage: 15 },
      { name: 'تخطيط قلب', percentage: 15 },
    ],
    tomorrowAppointments: 18,
  },
};

export const notifications = [
  { id: 'n1', type: 'booking', titleAr: 'حجز جديد', bodyAr: 'حجز جديد من أحمد محمد — 2:30 م اليوم', isRead: false, createdAt: '2026-02-22T08:00:00' },
  { id: 'n2', type: 'review', titleAr: 'تقييم جديد', bodyAr: 'تقييم 5 نجوم من فاطمة عبدالله', isRead: false, createdAt: '2026-02-22T07:30:00' },
  { id: 'n3', type: 'lab', titleAr: 'نتائج مخبرية', bodyAr: 'نتائج تحاليل أحمد محمد جاهزة', isRead: false, createdAt: '2026-02-22T07:00:00' },
  { id: 'n4', type: 'cancel', titleAr: 'إلغاء موعد', bodyAr: 'تم إلغاء موعد عمر حسين — 3:00 م', isRead: true, createdAt: '2026-02-21T18:00:00' },
  { id: 'n5', type: 'reminder', titleAr: 'تذكير', bodyAr: 'لديك 8 مواعيد غداً', isRead: true, createdAt: '2026-02-21T20:00:00' },
];
