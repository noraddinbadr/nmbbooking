import { useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DoctorCard from '@/components/DoctorCard';
import { specialties, cities } from '@/data/mockData';
import { useDoctors } from '@/hooks/useDoctors';
import { Button } from '@/components/ui/button';

const Doctors = () => {
  const [searchParams] = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialCity = searchParams.get('city') || '';
  const initialQuery = searchParams.get('q') || '';

  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [city, setCity] = useState(initialCity);
  const [query, setQuery] = useState(initialQuery);
  const [gender, setGender] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  const { data: doctors = [], isLoading } = useDoctors();

  const filtered = useMemo(() => {
    let result = [...doctors];

    if (specialty) result = result.filter(d => d.specialty === specialty);
    if (city) result = result.filter(d => d.city === city);
    if (gender) result = result.filter(d => d.gender === gender);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(d =>
        d.nameAr.includes(q) || d.nameEn.toLowerCase().includes(q) || d.specialtyAr.includes(q)
      );
    }

    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'price_low') result.sort((a, b) => a.basePrice - b.basePrice);
    else if (sortBy === 'price_high') result.sort((a, b) => b.basePrice - a.basePrice);
    else if (sortBy === 'reviews') result.sort((a, b) => b.totalReviews - a.totalReviews);

    return result;
  }, [doctors, specialty, city, gender, query, sortBy]);

  const selectedSpecialtyName = specialties.find(s => s.id === specialty)?.nameAr;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-cairo text-2xl font-bold text-foreground">
            {selectedSpecialtyName ? `أطباء ${selectedSpecialtyName}` : 'جميع الأطباء'}
          </h1>
          <p className="mt-1 font-cairo text-sm text-muted-foreground">{filtered.length} طبيب متاح</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-5 sticky top-24">
              <h3 className="font-cairo text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> تصفية النتائج
              </h3>
              <div>
                <label className="font-cairo text-xs font-medium text-muted-foreground mb-1.5 block">البحث</label>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اسم الطبيب..." className="w-full rounded-xl bg-muted px-3 py-2.5 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="font-cairo text-xs font-medium text-muted-foreground mb-1.5 block">التخصص</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">الكل</option>
                  {specialties.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
                </select>
              </div>
              <div>
                <label className="font-cairo text-xs font-medium text-muted-foreground mb-1.5 block">المدينة</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">الكل</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                </select>
              </div>
              <div>
                <label className="font-cairo text-xs font-medium text-muted-foreground mb-1.5 block">الجنس</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">الكل</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              <div>
                <label className="font-cairo text-xs font-medium text-muted-foreground mb-1.5 block">ترتيب حسب</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full rounded-xl bg-muted px-3 py-2.5 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="rating">التقييم</option>
                  <option value="price_low">السعر: الأقل أولاً</option>
                  <option value="price_high">السعر: الأعلى أولاً</option>
                  <option value="reviews">الأكثر تقييمات</option>
                </select>
              </div>
              <Button variant="outline" size="sm" className="w-full font-cairo" onClick={() => { setSpecialty(''); setCity(''); setGender(''); setQuery(''); setSortBy('rating'); }}>
                إعادة تعيين
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <Button variant="outline" size="sm" className="font-cairo lg:hidden gap-2" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              {showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
            </Button>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                <p className="font-cairo text-lg text-muted-foreground">لا يوجد أطباء بهذه المعايير</p>
                <p className="mt-2 font-cairo text-sm text-muted-foreground">جرب تغيير الفلاتر</p>
              </div>
            ) : (
              filtered.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Doctors;
