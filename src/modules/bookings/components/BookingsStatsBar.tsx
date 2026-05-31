interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export function BookingsStatsBar({ stats }: { stats: Stats }) {
  const cells = [
    { label: 'الكل', value: stats.total, color: 'bg-muted' },
    { label: 'معلّق', value: stats.pending, color: 'bg-yellow-50 border-yellow-200' },
    { label: 'مؤكد', value: stats.confirmed, color: 'bg-blue-50 border-blue-200' },
    { label: 'قيد الجلسة', value: stats.in_progress, color: 'bg-teal-50 border-teal-200' },
    { label: 'مكتمل', value: stats.completed, color: 'bg-green-50 border-green-200' },
    { label: 'ملغي/لم يحضر', value: stats.cancelled, color: 'bg-red-50 border-red-200' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
      {cells.map((s) => (
        <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
          <p className="font-cairo text-2xl font-bold text-foreground">{s.value}</p>
          <p className="font-cairo text-[11px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}