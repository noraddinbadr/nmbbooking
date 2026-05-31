import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';

export interface CatalogItem {
  id: string;
  nameAr: string;
  nameEn: string;
  defaultPrice: number;
  category?: string;
  tag?: string;
  hint?: string;
}

interface Props {
  items: CatalogItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export function CatalogPicker({ items, selected, onChange, placeholder = 'ابحث...' }: Props) {
  const [q, setQ] = useState('');
  const filtered = useMemo(
    () => items.filter((t) => t.nameAr.includes(q) || t.nameEn.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-3 mt-2">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder={placeholder} className="font-cairo text-xs pr-9 h-8" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const it = items.find((x) => x.id === id);
            return it ? (
              <Badge key={id} className="font-cairo text-[10px] gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => toggle(id)}>
                {it.nameAr} <X className="h-2.5 w-2.5" />
              </Badge>
            ) : null;
          })}
        </div>
      )}
      <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
        {filtered.map((it) => (
          <label
            key={it.id}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selected.includes(it.id) ? 'bg-primary/10' : 'hover:bg-muted/60'}`}
          >
            <Checkbox checked={selected.includes(it.id)} onCheckedChange={() => toggle(it.id)} />
            <div className="flex-1 min-w-0">
              <p className="font-cairo text-xs font-medium text-foreground truncate">{it.nameAr}</p>
              <p className="text-[10px] text-muted-foreground">{it.nameEn} • {it.defaultPrice.toLocaleString()} ر.ي</p>
              {it.hint && <p className="font-cairo text-[10px] text-amber-600">⚠️ {it.hint}</p>}
            </div>
            {it.tag && <Badge variant="outline" className="font-cairo text-[9px] h-4 shrink-0">{it.tag}</Badge>}
          </label>
        ))}
      </div>
    </div>
  );
}