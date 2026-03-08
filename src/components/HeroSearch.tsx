import { Search, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHomeStats } from '@/hooks/useHomeStats';
import { cities, serviceLabels } from '@/data/constants';
import { useDoctors } from '@/hooks/useDoctors';

const HeroSearch = () => {
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: stats, isLoading } = useHomeStats();
  const { data: doctors = [] } = useDoctors();

  // Build specialties from actual DB doctors
  const specialties = Array.from(
    new Map(doctors.filter(d => d.specialty).map(d => [d.specialty, d.specialtyAr])).entries()
  ).map(([id, nameAr]) => ({ id, nameAr }));

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    if (city) params.set('city', city);
    if (searchQuery) params.set('q', searchQuery);
    navigate(`/doctors?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-hero-gradient py-20 md:py-28">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-foreground blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <h1 className="font-cairo text-4xl font-extrabold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
          احجز موعدك مع أفضل الأطباء
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-cairo text-lg text-primary-foreground/80">
          ابحث عن طبيبك المفضل واحجز موعدك بسهولة. أكثر من {stats?.doctorCount || '...'} طبيب في مختلف التخصصات.
        </p>

        <div className="mx-auto mt-10 max-w-4xl">
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-hero md:flex-row md:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="ابحث عن طبيب أو تخصص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-0 bg-muted px-4 py-3 font-cairo text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="rounded-xl border-0 bg-muted px-4 py-3 font-cairo text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-48"
              dir="rtl"
            >
              <option value="">كل التخصصات</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.nameAr}</option>
              ))}
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border-0 bg-muted px-4 py-3 font-cairo text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-40"
              dir="rtl"
            >
              <option value="">كل المدن</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.nameAr}</option>
              ))}
            </select>
            <Button
              onClick={handleSearch}
              size="lg"
              className="gap-2 bg-hero-gradient font-cairo text-primary-foreground shadow-hero hover:opacity-90"
            >
              <Search className="h-5 w-5" />
              ابحث
            </Button>
          </div>
        </div>

        {/* Dynamic Stats */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          ) : (
            [
              { value: `+${stats?.doctorCount || 0}`, label: 'طبيب' },
              { value: `+${stats?.bookingCount || 0}`, label: 'حجز ناجح' },
              { value: stats?.avgRating?.toFixed(1) || '0', label: 'تقييم' },
              { value: String(stats?.cityCount || 0), label: 'مدن' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-cairo text-3xl font-extrabold text-primary-foreground">{stat.value}</div>
                <div className="mt-1 font-cairo text-sm text-primary-foreground/70">{stat.label}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
