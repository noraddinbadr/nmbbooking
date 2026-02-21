import { Star, MapPin, Clock, CheckCircle, GraduationCap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Doctor } from '@/data/types';

interface Props {
  doctor: Doctor;
}

const DoctorProfileHeader = ({ doctor }: Props) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex gap-5">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-primary/10">
          <div className="flex h-full w-full items-center justify-center font-cairo text-4xl font-bold text-primary">
            {doctor.nameAr.charAt(2)}
          </div>
          {doctor.isVerified && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1">
              <CheckCircle className="h-6 w-6 text-primary fill-primary/20" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-cairo text-2xl font-bold text-foreground">{doctor.nameAr}</h1>
              <p className="font-cairo text-muted-foreground">{doctor.specialtyAr}</p>
            </div>
            {doctor.isSponsored && (
              <Badge className="gap-1 bg-amber-50 text-amber-500 border-0 font-cairo">
                <Sparkles className="h-3 w-3" /> خدمات مدعومة
              </Badge>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <strong className="text-foreground">{doctor.rating}</strong> ({doctor.totalReviews} تقييم)
            </span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {doctor.clinicNameAr} - {doctor.cityAr}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> انتظار: {doctor.waitTime}</span>
            <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {doctor.yearsExperience} سنة خبرة</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileHeader;
