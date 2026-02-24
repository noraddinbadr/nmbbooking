import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface HoldCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
  className?: string;
}

const HoldCountdown = ({ expiresAt, onExpired, className }: HoldCountdownProps) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const expires = new Date(expiresAt).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 60;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-2.5 font-cairo text-sm transition-colors',
        isUrgent
          ? 'bg-destructive/10 text-destructive animate-pulse-soft'
          : 'bg-amber-50 text-amber-500',
        className
      )}
      dir="rtl"
    >
      <Timer className="h-4 w-4" />
      <span>
        {seconds > 0
          ? `متبقي ${mins}:${secs.toString().padStart(2, '0')} لتأكيد الحجز`
          : 'انتهت مهلة الحجز المؤقت'}
      </span>
    </div>
  );
};

export default HoldCountdown;
