import { Star } from 'lucide-react';
import { Review } from '@/data/types';

interface Props {
  reviews: Review[];
}

const DoctorReviews = ({ reviews }: Props) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-cairo text-lg font-bold text-foreground mb-4">التقييمات ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="font-cairo text-sm text-muted-foreground">لا توجد تقييمات بعد</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-border pb-4 last:border-0">
              <div className="flex items-center justify-between">
                <span className="font-cairo text-sm font-semibold text-foreground">{review.patientName}</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>
              <p className="mt-1 font-cairo text-sm text-muted-foreground">{review.comment}</p>
              <span className="mt-1 block font-cairo text-xs text-muted-foreground">{review.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorReviews;
