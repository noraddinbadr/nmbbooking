import DoctorCard from '@/components/DoctorCard';
import { useDoctors } from '@/hooks/useDoctors';
import { Loader2 } from 'lucide-react';

const FeaturedDoctors = () => {
  const { data: doctors = [], isLoading } = useDoctors();
  const featured = doctors.filter(d => d.rating >= 4.7).slice(0, 4);

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="font-cairo text-3xl font-bold text-foreground">أفضل الأطباء</h2>
          <p className="mt-2 font-cairo text-muted-foreground">الأعلى تقييماً من مرضانا</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedDoctors;
