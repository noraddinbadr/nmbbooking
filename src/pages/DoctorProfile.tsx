import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DoctorProfileHeader from '@/components/doctor/DoctorProfileHeader';
import DoctorAbout from '@/components/doctor/DoctorAbout';
import DoctorReviews from '@/components/doctor/DoctorReviews';
import BookingSidebar from '@/components/doctor/BookingSidebar';
import { useDoctor } from '@/hooks/useDoctors';
import { Button } from '@/components/ui/button';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doctor, isLoading } = useDoctor(id || '');

  // TODO: fetch reviews from DB when reviews table is created
  const doctorReviews: any[] = [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="container mx-auto p-8 text-center">
          <p className="font-cairo text-xl text-muted-foreground">لم يتم العثور على الطبيب</p>
          <Button className="mt-4 font-cairo" onClick={() => navigate('/doctors')}>العودة للأطباء</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2 font-cairo text-sm text-muted-foreground">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">الرئيسية</button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <button onClick={() => navigate('/doctors')} className="hover:text-primary transition-colors">الأطباء</button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <span className="text-foreground">{doctor.nameAr}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="order-2 lg:order-1">
            <BookingSidebar doctor={doctor} />
          </div>
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            <DoctorProfileHeader doctor={doctor} />
            <DoctorAbout doctor={doctor} />
            <DoctorReviews reviews={doctorReviews} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DoctorProfile;
