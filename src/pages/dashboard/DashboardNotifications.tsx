import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Check, CheckCheck, Search, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  booking: { label: 'حجز جديد', icon: '📅', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  booking_confirmed: { label: 'تأكيد حجز', icon: '✅', color: 'bg-green-100 text-green-800 border-green-200' },
  booking_cancelled: { label: 'إلغاء حجز', icon: '❌', color: 'bg-red-100 text-red-800 border-red-200' },
  booking_completed: { label: 'حجز مكتمل', icon: '🏁', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  booking_reminder: { label: 'تذكير', icon: '⏰', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  review: { label: 'تقييم', icon: '⭐', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  lab: { label: 'مختبر', icon: '🧪', color: 'bg-purple-100 text-purple-800 border-purple-200' },
};

const DashboardNotifications = () => {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Get unique types from notifications
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types);
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (readFilter === 'unread' && n.is_read) return false;
      if (readFilter === 'read' && !n.is_read) return false;
      if (dateFilter) {
        const notifDate = n.created_at.split('T')[0];
        if (notifDate !== dateFilter) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        if (
          !n.title_ar.toLowerCase().includes(s) &&
          !(n.body_ar || '').toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [notifications, typeFilter, readFilter, dateFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    filtered.forEach(n => {
      const date = new Date(n.created_at).toLocaleDateString('ar-YE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(n);
    });
    return groups;
  }, [filtered]);

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    today: notifications.filter(n => n.created_at.split('T')[0] === new Date().toISOString().split('T')[0]).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-cairo text-xl font-bold text-foreground">الإشعارات</h1>
            <p className="font-cairo text-sm text-muted-foreground">جميع الإشعارات والتنبيهات</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="font-cairo gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" /> قراءة الكل
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'الإجمالي', value: stats.total, icon: Bell },
            { label: 'غير مقروء', value: stats.unread, icon: BellOff },
            { label: 'اليوم', value: stats.today, icon: Check },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <s.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="font-cairo text-2xl font-bold text-foreground">{s.value}</p>
              <p className="font-cairo text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الإشعارات..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="font-cairo pr-9 h-9 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] font-cairo h-9 text-sm">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">كل الأنواع</SelectItem>
              {availableTypes.map(t => (
                <SelectItem key={t} value={t}>
                  {typeConfig[t]?.icon || '🔔'} {typeConfig[t]?.label || t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className="w-[130px] font-cairo h-9 text-sm">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent className="font-cairo">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="unread">غير مقروء</SelectItem>
              <SelectItem value="read">مقروء</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-cairo"
            dir="ltr"
          />
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <h3 className="font-cairo text-xs font-semibold text-muted-foreground mb-2 px-1">{date}</h3>
                <div className="space-y-2">
                  {items.map(n => {
                    const config = typeConfig[n.type] || { label: n.type, icon: '🔔', color: 'bg-muted text-muted-foreground' };
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className={cn(
                          "rounded-xl border p-4 transition-all cursor-pointer hover:shadow-sm",
                          n.is_read
                            ? "border-border bg-card opacity-70"
                            : "border-primary/20 bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg shrink-0">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-cairo font-semibold text-foreground text-sm">{n.title_ar}</span>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-cairo font-medium ${config.color}`}>
                                {config.label}
                              </span>
                              {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                            </div>
                            {n.body_ar && (
                              <p className="font-cairo text-xs text-muted-foreground">{n.body_ar}</p>
                            )}
                            <p className="font-cairo text-[10px] text-muted-foreground mt-1">
                              {new Date(n.created_at).toLocaleString('ar-YE', {
                                hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                          </div>
                          {!n.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="font-cairo text-xs text-muted-foreground text-end">إجمالي: {filtered.length} إشعار</p>
      </div>
    </DashboardLayout>
  );
};

export default DashboardNotifications;
