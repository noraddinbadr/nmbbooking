import { GraduationCap, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Doctor } from '@/data/types';

interface Props {
  doctor: Doctor;
}

const DoctorAbout = ({ doctor }: Props) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-cairo text-lg font-bold text-foreground mb-3">معلومات عن الدكتور</h2>
      <p className="font-cairo text-sm text-muted-foreground leading-relaxed">{doctor.aboutAr}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-cairo text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> التعليم
          </h3>
          <ul className="space-y-1">
            {doctor.education.map((edu, i) => (
              <li key={i} className="font-cairo text-sm text-muted-foreground">• {edu}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-cairo text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" /> اللغات
          </h3>
          <div className="flex gap-2">
            {doctor.languages.map((lang, i) => (
              <Badge key={i} variant="secondary" className="font-cairo">{lang}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAbout;
