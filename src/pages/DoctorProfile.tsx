import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DoctorProfileHeader from '@/components/doctor/DoctorProfileHeader';
import DoctorAbout from '@/components/doctor/DoctorAbout';
import DoctorReviews from '@/components/doctor/DoctorReviews';
import BookingSidebar from '@/components/doctor/BookingSidebar';
import { doctors, reviews as allReviews } from '@/data/mockData';
import { Button } from '@/components/ui/button';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const doctor = doctors.find(d => d.id === id);
  const doctorReviews = allReviews.filter(r => r.doctorId === id);

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
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 font-cairo text-sm text-muted-foreground">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">الرئيسية</button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <button onClick={() => navigate('/doctors')} className="hover:text-primary transition-colors">الأطباء</button>
          <ArrowRight className="h-3 w-3 rotate-180" />
          <span className="text-foreground">{doctor.nameAr}</span>
        </div>

        {/* Vezeeta layout: Booking sidebar on the right (in RTL = left visually), Doctor info on left */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Booking sidebar - comes first in RTL */}
          <div className="order-2 lg:order-1">
            <BookingSidebar doctor={doctor} />
          </div>

          {/* Main content */}
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
