import { Link } from 'react-router-dom';
import { specialties } from '@/data/mockData';

const SpecialtyGrid = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="font-cairo text-3xl font-bold text-foreground">التخصصات الطبية</h2>
          <p className="mt-2 font-cairo text-muted-foreground">اختر التخصص المناسب لحالتك</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {specialties.map((spec, i) => (
            <Link
              key={spec.id}
              to={`/doctors?specialty=${spec.id}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-3xl">{spec.icon}</span>
              <span className="font-cairo text-sm font-semibold text-foreground text-center">{spec.nameAr}</span>
              <span className="font-cairo text-xs text-muted-foreground">{spec.doctorCount} طبيب</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialtyGrid;
