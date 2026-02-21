import { doctors } from '@/data/mockData';
import DoctorCard from '@/components/DoctorCard';

const FeaturedDoctors = () => {
  const featured = doctors.filter(d => d.rating >= 4.7).slice(0, 4);

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="font-cairo text-3xl font-bold text-foreground">أفضل الأطباء</h2>
          <p className="mt-2 font-cairo text-muted-foreground">الأعلى تقييماً من مرضانا</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDoctors;
