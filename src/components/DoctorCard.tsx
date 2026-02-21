import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { Doctor } from '@/data/types';
import { bookingTypeLabels } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const discountedPrice = doctor.basePrice * (1 - doctor.discountPercent / 100);

  return (
    <Link
      to={`/doctor/${doctor.id}`}
      className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
          <div className="flex h-full w-full items-center justify-center bg-primary/10 font-cairo text-2xl font-bold text-primary">
            {doctor.nameAr.charAt(2)}
          </div>
          {doctor.isVerified && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5">
              <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1" dir="rtl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-cairo text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {doctor.nameAr}
              </h3>
              <p className="font-cairo text-sm text-muted-foreground">{doctor.specialtyAr}</p>
            </div>
            {doctor.isSponsored && (
              <Badge variant="secondary" className="shrink-0 gap-1 bg-amber-50 text-amber-500 border-0 font-cairo text-xs">
                <Sparkles className="h-3 w-3" />
                مدعوم
              </Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-foreground">{doctor.rating}</span>
              <span>({doctor.totalReviews})</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {doctor.cityAr}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {doctor.waitTime}
            </span>
          </div>

          {/* Booking types */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {doctor.bookingTypes.map((type) => (
              <span
                key={type}
                className="rounded-lg bg-muted px-2 py-1 font-cairo text-xs text-muted-foreground"
              >
                {bookingTypeLabels[type]?.icon} {bookingTypeLabels[type]?.ar}
              </span>
            ))}
          </div>

          {/* Price & CTA */}
          <div className="mt-4 flex items-center justify-between">
            <div className="font-cairo" dir="rtl">
              {doctor.discountPercent > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{discountedPrice.toLocaleString()} ر.ي</span>
                  <span className="text-sm text-muted-foreground line-through">{doctor.basePrice.toLocaleString()}</span>
                  <Badge variant="destructive" className="text-xs font-cairo">-{doctor.discountPercent}%</Badge>
                </div>
              ) : (
                <span className="text-lg font-bold text-primary">{doctor.basePrice.toLocaleString()} ر.ي</span>
              )}
            </div>
            <Button
              size="sm"
              className="font-cairo bg-hero-gradient text-primary-foreground hover:opacity-90"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              احجز الآن
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DoctorCard;
