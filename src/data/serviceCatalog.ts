// Service Catalog — system-managed items with default prices; doctors can override prices

export interface CatalogMedicine {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  defaultPrice: number;
  doctorPrice?: number; // doctor override
  unit: string;
}

export interface CatalogLabTest {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  defaultPrice: number;
  doctorPrice?: number;
}

export interface CatalogImaging {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  defaultPrice: number;
  doctorPrice?: number;
}

export interface CatalogProcedure {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  defaultPrice: number;
  doctorPrice?: number;
  durationMin: number;
  prepInstructions?: string;
}

export const catalogMedicines: CatalogMedicine[] = [
  { id: 'med1', nameAr: 'أسبرين', nameEn: 'Aspirin', category: 'مسكنات', defaultPrice: 500, unit: 'قرص' },
  { id: 'med2', nameAr: 'أموكسيسيلين', nameEn: 'Amoxicillin', category: 'مضادات حيوية', defaultPrice: 1200, unit: 'كبسولة' },
  { id: 'med3', nameAr: 'أتورفاستاتين', nameEn: 'Atorvastatin', category: 'كوليسترول', defaultPrice: 1800, unit: 'قرص' },
  { id: 'med4', nameAr: 'باراسيتامول', nameEn: 'Paracetamol', category: 'مسكنات', defaultPrice: 300, unit: 'قرص' },
  { id: 'med5', nameAr: 'أوميبرازول', nameEn: 'Omeprazole', category: 'معدة', defaultPrice: 800, unit: 'كبسولة' },
  { id: 'med6', nameAr: 'ميتفورمين', nameEn: 'Metformin', category: 'سكري', defaultPrice: 600, unit: 'قرص' },
  { id: 'med7', nameAr: 'أملوديبين', nameEn: 'Amlodipine', category: 'ضغط', defaultPrice: 900, unit: 'قرص' },
  { id: 'med8', nameAr: 'سيتريزين', nameEn: 'Cetirizine', category: 'حساسية', defaultPrice: 400, unit: 'قرص' },
  { id: 'med9', nameAr: 'إيبوبروفين', nameEn: 'Ibuprofen', category: 'مسكنات', defaultPrice: 450, unit: 'قرص' },
  { id: 'med10', nameAr: 'أزيثرومايسين', nameEn: 'Azithromycin', category: 'مضادات حيوية', defaultPrice: 2000, unit: 'قرص' },
  { id: 'med11', nameAr: 'لوسارتان', nameEn: 'Losartan', category: 'ضغط', defaultPrice: 1100, unit: 'قرص' },
  { id: 'med12', nameAr: 'فيتامين D', nameEn: 'Vitamin D', category: 'فيتامينات', defaultPrice: 700, unit: 'كبسولة' },
];

export const catalogLabTests: CatalogLabTest[] = [
  { id: 'lt1', nameAr: 'صورة دم كاملة', nameEn: 'CBC', category: 'دم', defaultPrice: 3000 },
  { id: 'lt2', nameAr: 'سكر صائم', nameEn: 'Fasting Blood Sugar', category: 'سكر', defaultPrice: 1500 },
  { id: 'lt3', nameAr: 'كوليسترول شامل', nameEn: 'Lipid Profile', category: 'كوليسترول', defaultPrice: 4000 },
  { id: 'lt4', nameAr: 'وظائف كبد', nameEn: 'Liver Function', category: 'دم', defaultPrice: 3500 },
  { id: 'lt5', nameAr: 'وظائف كلى', nameEn: 'Kidney Function', category: 'دم', defaultPrice: 3500 },
  { id: 'lt6', nameAr: 'هرمونات الغدة الدرقية', nameEn: 'Thyroid Panel', category: 'هرمونات', defaultPrice: 5000 },
  { id: 'lt7', nameAr: 'تحليل بول', nameEn: 'Urinalysis', category: 'بول', defaultPrice: 2000 },
  { id: 'lt8', nameAr: 'فيتامين D', nameEn: 'Vitamin D Test', category: 'فيتامينات', defaultPrice: 4500 },
  { id: 'lt9', nameAr: 'فيروسات كبد B', nameEn: 'Hepatitis B', category: 'فيروسات', defaultPrice: 3000 },
  { id: 'lt10', nameAr: 'سكر تراكمي', nameEn: 'HbA1c', category: 'سكر', defaultPrice: 3500 },
  { id: 'lt11', nameAr: 'حمض اليوريك', nameEn: 'Uric Acid', category: 'دم', defaultPrice: 2000 },
  { id: 'lt12', nameAr: 'ESR', nameEn: 'ESR', category: 'دم', defaultPrice: 1500 },
];

export const catalogImaging: CatalogImaging[] = [
  { id: 'img1', nameAr: 'أشعة سينية — صدر', nameEn: 'Chest X-Ray', type: 'xray', defaultPrice: 5000 },
  { id: 'img2', nameAr: 'أشعة سينية — عظام', nameEn: 'Bone X-Ray', type: 'xray', defaultPrice: 4000 },
  { id: 'img3', nameAr: 'أشعة مقطعية — رأس', nameEn: 'Head CT', type: 'ct', defaultPrice: 25000 },
  { id: 'img4', nameAr: 'أشعة مقطعية — بطن', nameEn: 'Abdominal CT', type: 'ct', defaultPrice: 30000 },
  { id: 'img5', nameAr: 'رنين مغناطيسي — دماغ', nameEn: 'Brain MRI', type: 'mri', defaultPrice: 50000 },
  { id: 'img6', nameAr: 'رنين مغناطيسي — ركبة', nameEn: 'Knee MRI', type: 'mri', defaultPrice: 40000 },
  { id: 'img7', nameAr: 'سونار — بطن', nameEn: 'Abdominal Ultrasound', type: 'ultrasound', defaultPrice: 8000 },
  { id: 'img8', nameAr: 'إيكو — قلب', nameEn: 'Echocardiogram', type: 'echo', defaultPrice: 15000 },
];

export const catalogProcedures: CatalogProcedure[] = [
  { id: 'proc1', nameAr: 'حقن عضلي', nameEn: 'IM Injection', category: 'حقن', defaultPrice: 2000, durationMin: 10 },
  { id: 'proc2', nameAr: 'حقن وريدي', nameEn: 'IV Injection', category: 'حقن', defaultPrice: 3000, durationMin: 20 },
  { id: 'proc3', nameAr: 'تطعيم أطفال', nameEn: 'Child Vaccination', category: 'تطعيمات', defaultPrice: 3000, durationMin: 15 },
  { id: 'proc4', nameAr: 'تنظيف أسنان', nameEn: 'Dental Cleaning', category: 'أسنان', defaultPrice: 5000, durationMin: 30 },
  { id: 'proc5', nameAr: 'حشوة أسنان', nameEn: 'Dental Filling', category: 'أسنان', defaultPrice: 8000, durationMin: 45 },
  { id: 'proc6', nameAr: 'خلع أسنان', nameEn: 'Tooth Extraction', category: 'أسنان', defaultPrice: 6000, durationMin: 30 },
  { id: 'proc7', nameAr: 'تضميد جروح', nameEn: 'Wound Dressing', category: 'جروح', defaultPrice: 1500, durationMin: 15 },
  { id: 'proc8', nameAr: 'جراحة بسيطة', nameEn: 'Minor Surgery', category: 'جراحة', defaultPrice: 15000, durationMin: 60, prepInstructions: 'صيام 6 ساعات قبل العملية' },
  { id: 'proc9', nameAr: 'إزالة غرز', nameEn: 'Suture Removal', category: 'جروح', defaultPrice: 1000, durationMin: 10 },
  { id: 'proc10', nameAr: 'تخطيط قلب', nameEn: 'ECG', category: 'قلب', defaultPrice: 5000, durationMin: 15 },
];

// Helper to get unique categories
export const getMedicineCategories = () => [...new Set(catalogMedicines.map(m => m.category))];
export const getLabCategories = () => [...new Set(catalogLabTests.map(t => t.category))];
export const getImagingTypes = () => [...new Set(catalogImaging.map(i => i.type))];
export const getProcedureCategories = () => [...new Set(catalogProcedures.map(p => p.category))];

export const imagingTypeLabels: Record<string, string> = {
  xray: 'أشعة سينية', ct: 'أشعة مقطعية', mri: 'رنين مغناطيسي',
  ultrasound: 'سونار', echo: 'إيكو',
};
