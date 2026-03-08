/**
 * Shared constants — labels, icons, static lookups.
 * NO mock data here. All dynamic data comes from the database.
 */

export const bookingTypeLabels: Record<string, { ar: string; en: string; icon: string }> = {
  clinic: { ar: 'عيادة', en: 'Clinic', icon: '🏥' },
  hospital: { ar: 'مستشفى', en: 'Hospital', icon: '🏨' },
  home: { ar: 'زيارة منزلية', en: 'Home Visit', icon: '🏠' },
  video: { ar: 'فيديو', en: 'Video Call', icon: '📹' },
  voice: { ar: 'مكالمة صوتية', en: 'Voice Call', icon: '📞' },
  lab: { ar: 'تحاليل', en: 'Lab Test', icon: '🧪' },
};

export const serviceLabels: Record<string, string> = {
  cardiology: 'قلب وأوعية',
  ophthalmology: 'عيون',
  internal: 'باطنية',
  general: 'طب عام',
  orthopedics: 'عظام',
  dental: 'أسنان',
  dermatology: 'جلدية',
  pediatrics: 'أطفال',
  dentistry: 'أسنان',
  ent: 'أنف وأذن وحنجرة',
  neurology: 'مخ وأعصاب',
  gynecology: 'نساء وتوليد',
  urology: 'مسالك بولية',
  psychiatry: 'نفسية',
};

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
  no_show: 'لم يحضر',
  in_progress: 'جاري',
};

export const specialtyIcons: Record<string, string> = {
  cardiology: '❤️', dermatology: '🧴', pediatrics: '👶', orthopedics: '🦴',
  ophthalmology: '👁️', dentistry: '🦷', ent: '👂', neurology: '🧠',
  gynecology: '🤰', urology: '🏥', psychiatry: '🧘', internal: '🩺',
  general: '🩺',
};

/** Static city list for filters (could be moved to DB later) */
export const cities = [
  { id: 'sanaa', nameAr: 'صنعاء', nameEn: 'Sanaa' },
  { id: 'aden', nameAr: 'عدن', nameEn: 'Aden' },
  { id: 'taiz', nameAr: 'تعز', nameEn: 'Taiz' },
  { id: 'hodeidah', nameAr: 'الحديدة', nameEn: 'Hodeidah' },
  { id: 'ibb', nameAr: 'إب', nameEn: 'Ibb' },
  { id: 'mukalla', nameAr: 'المكلا', nameEn: 'Mukalla' },
];
