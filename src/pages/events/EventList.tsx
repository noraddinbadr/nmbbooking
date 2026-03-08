import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/events/EventCard';
import { serviceLabels } from '@/data/constants';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { MedicalCamp } from '@/data/eventsTypes';

const EventList = () => {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [camps, setCamps] = useState<MedicalCamp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('medical_camps')
        .select('*')
        .in('status', ['published', 'active', 'completed'])
        .order('start_date', { ascending: false });
      setCamps((data || []).map((c: any): MedicalCamp => ({
        id: c.id,
        titleAr: c.title_ar,
        titleEn: c.title_en || '',
        descriptionAr: c.description_ar || '',
        descriptionEn: c.description_en || '',
        clinicId: c.clinic_id || '',
        organizerId: c.organizer_id,
        locationName: c.location_name || '',
        locationCity: c.location_city || '',
        status: c.status || 'draft',
        startDate: c.start_date || '',
        endDate: c.end_date || '',
        totalCapacity: c.total_capacity || 0,
        services: c.services || [],
        sponsors: (c.sponsors as any[]) || [],
        isFree: c.is_free ?? true,
        targetFund: c.target_fund || 0,
        raisedFund: c.raised_fund || 0,
        createdAt: c.created_at,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const allCities = [...new Set(camps.map(c => c.locationCity).filter(Boolean))];
  const allServices = [...new Set(camps.flatMap(c => c.services))];

  const filtered = useMemo(() => {
    return camps.filter(camp => {
      const matchSearch = !search ||
        camp.titleAr.includes(search) ||
        camp.titleEn?.toLowerCase().includes(search.toLowerCase()) ||
        camp.locationName.includes(search);
      const matchCity = cityFilter === 'all' || camp.locationCity === cityFilter;
      const matchService = serviceFilter === 'all' || camp.services.includes(serviceFilter);
      return matchSearch && matchCity && matchService;
    });
  }, [camps, search, cityFilter, serviceFilter]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <section className="bg-hero-gradient py-12 px-4">
        <div className="container max-w-5xl mx-auto text-center">
          <Heart className="h-8 w-8 text-primary-foreground/80 mx-auto mb-3" />
          <h1 className="font-cairo font-bold text-3xl md:text-4xl text-primary-foreground mb-2">الأحداث والمخيمات الطبية</h1>
          <p className="font-cairo text-primary-foreground/80 text-sm md:text-base max-w-lg mx-auto">مخيمات طبية مجانية لخدمة المجتمع — سجّل الآن أو تبرّع لدعم حالة مرضية</p>
        </div>
      </section>

      <section className="container max-w-5xl mx-auto -mt-6 px-4 relative z-10">
        <div className="bg-card rounded-xl shadow-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن حدث طبي..." className="pr-9 font-cairo" />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[140px] font-cairo"><SelectValue placeholder="المدينة" /></SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">كل المدن</SelectItem>
              {allCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[140px] font-cairo"><SelectValue placeholder="التخصص" /></SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">كل التخصصات</SelectItem>
              {allServices.map(s => <SelectItem key={s} value={s}>{serviceLabels[s] || s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="container max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(camp => <EventCard key={camp.id} camp={camp} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-cairo text-muted-foreground">لا توجد أحداث تطابق البحث</p>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default EventList;
