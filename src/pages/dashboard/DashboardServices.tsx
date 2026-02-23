import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  catalogMedicines, catalogLabTests, catalogImaging, catalogProcedures,
  getMedicineCategories, getLabCategories, getImagingTypes, getProcedureCategories,
  imagingTypeLabels,
  type CatalogMedicine, type CatalogLabTest, type CatalogImaging, type CatalogProcedure,
} from '@/data/serviceCatalog';
import { Pill, TestTube, ScanLine, Syringe, Search, Edit2, Check, X, Clock } from 'lucide-react';

type EditingPrice = { id: string; value: string } | null;

const DashboardServices = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingPrice, setEditingPrice] = useState<EditingPrice>(null);

  // Local price overrides (in production: persisted per doctor)
  const [medPrices, setMedPrices] = useState<Record<string, number>>({});
  const [labPrices, setLabPrices] = useState<Record<string, number>>({});
  const [imgPrices, setImgPrices] = useState<Record<string, number>>({});
  const [procPrices, setProcPrices] = useState<Record<string, number>>({});

  const savePrice = (tab: string, id: string, price: number) => {
    if (tab === 'medicines') setMedPrices(p => ({ ...p, [id]: price }));
    else if (tab === 'labs') setLabPrices(p => ({ ...p, [id]: price }));
    else if (tab === 'imaging') setImgPrices(p => ({ ...p, [id]: price }));
    else setProcPrices(p => ({ ...p, [id]: price }));
    setEditingPrice(null);
  };

  const resetPrice = (tab: string, id: string) => {
    if (tab === 'medicines') setMedPrices(p => { const n = { ...p }; delete n[id]; return n; });
    else if (tab === 'labs') setLabPrices(p => { const n = { ...p }; delete n[id]; return n; });
    else if (tab === 'imaging') setImgPrices(p => { const n = { ...p }; delete n[id]; return n; });
    else setProcPrices(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const filterBySearch = <T extends { nameAr: string; nameEn: string }>(items: T[]) =>
    items.filter(i => i.nameAr.includes(search) || i.nameEn.toLowerCase().includes(search.toLowerCase()));

  const PriceCell = ({ id, defaultPrice, customPrice, tab }: { id: string; defaultPrice: number; customPrice?: number; tab: string }) => {
    const isEditing = editingPrice?.id === id;
    const hasCustom = customPrice !== undefined;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            className="font-cairo text-xs w-24 h-7"
            value={editingPrice.value}
            onChange={e => setEditingPrice({ id, value: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && savePrice(tab, id, Number(editingPrice.value))}
            autoFocus
          />
          <button onClick={() => savePrice(tab, id, Number(editingPrice.value))} className="text-emerald-500 hover:text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
          <button onClick={() => setEditingPrice(null)} className="text-destructive hover:text-destructive/80"><X className="h-3.5 w-3.5" /></button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className={`font-cairo text-sm font-bold ${hasCustom ? 'text-primary' : 'text-foreground'}`}>
          {(customPrice ?? defaultPrice).toLocaleString()} ر.ي
        </span>
        {hasCustom && (
          <span className="font-cairo text-[10px] text-muted-foreground line-through">{defaultPrice.toLocaleString()}</span>
        )}
        <button onClick={() => setEditingPrice({ id, value: String(customPrice ?? defaultPrice) })} className="text-muted-foreground hover:text-primary">
          <Edit2 className="h-3 w-3" />
        </button>
        {hasCustom && (
          <button onClick={() => resetPrice(tab, id)} className="text-muted-foreground hover:text-destructive" title="إعادة السعر الافتراضي">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo text-2xl font-bold text-foreground">كتالوج الخدمات</h1>
          <p className="font-cairo text-xs text-muted-foreground">يمكنك تعديل الأسعار لعيادتك • الأسعار الافتراضية من إدارة النظام</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن دواء، تحليل، أشعة، أو إجراء..."
            className="font-cairo pr-10"
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory('all'); }}
          />
        </div>

        <Tabs defaultValue="medicines" onValueChange={() => { setActiveCategory('all'); setEditingPrice(null); }}>
          <TabsList className="font-cairo w-full grid grid-cols-4">
            <TabsTrigger value="medicines" className="font-cairo gap-1"><Pill className="h-3.5 w-3.5" /> الأدوية <Badge variant="secondary" className="font-cairo text-[10px] mr-1">{catalogMedicines.length}</Badge></TabsTrigger>
            <TabsTrigger value="labs" className="font-cairo gap-1"><TestTube className="h-3.5 w-3.5" /> التحاليل <Badge variant="secondary" className="font-cairo text-[10px] mr-1">{catalogLabTests.length}</Badge></TabsTrigger>
            <TabsTrigger value="imaging" className="font-cairo gap-1"><ScanLine className="h-3.5 w-3.5" /> الأشعة <Badge variant="secondary" className="font-cairo text-[10px] mr-1">{catalogImaging.length}</Badge></TabsTrigger>
            <TabsTrigger value="procedures" className="font-cairo gap-1"><Syringe className="h-3.5 w-3.5" /> الإجراءات <Badge variant="secondary" className="font-cairo text-[10px] mr-1">{catalogProcedures.length}</Badge></TabsTrigger>
          </TabsList>

          {/* Medicines */}
          <TabsContent value="medicines">
            <CategoryFilter categories={getMedicineCategories()} active={activeCategory} onChange={setActiveCategory} />
            <div className="space-y-2 mt-3">
              {filterBySearch(catalogMedicines)
                .filter(m => activeCategory === 'all' || m.category === activeCategory)
                .map(med => (
                  <Card key={med.id} className="shadow-sm hover:shadow-card transition-shadow">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Pill className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-cairo text-sm font-medium text-foreground">{med.nameAr}</p>
                          <p className="text-xs text-muted-foreground">{med.nameEn} • {med.unit} • <Badge variant="outline" className="font-cairo text-[10px] h-4">{med.category}</Badge></p>
                        </div>
                      </div>
                      <PriceCell id={med.id} defaultPrice={med.defaultPrice} customPrice={medPrices[med.id]} tab="medicines" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Lab Tests */}
          <TabsContent value="labs">
            <CategoryFilter categories={getLabCategories()} active={activeCategory} onChange={setActiveCategory} />
            <div className="space-y-2 mt-3">
              {filterBySearch(catalogLabTests)
                .filter(t => activeCategory === 'all' || t.category === activeCategory)
                .map(test => (
                  <Card key={test.id} className="shadow-sm hover:shadow-card transition-shadow">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TestTube className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-cairo text-sm font-medium text-foreground">{test.nameAr}</p>
                          <p className="text-xs text-muted-foreground">{test.nameEn} • <Badge variant="outline" className="font-cairo text-[10px] h-4">{test.category}</Badge></p>
                        </div>
                      </div>
                      <PriceCell id={test.id} defaultPrice={test.defaultPrice} customPrice={labPrices[test.id]} tab="labs" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Imaging */}
          <TabsContent value="imaging">
            <CategoryFilter categories={getImagingTypes().map(t => t)} active={activeCategory} onChange={setActiveCategory} labels={imagingTypeLabels} />
            <div className="space-y-2 mt-3">
              {filterBySearch(catalogImaging)
                .filter(i => activeCategory === 'all' || i.type === activeCategory)
                .map(img => (
                  <Card key={img.id} className="shadow-sm hover:shadow-card transition-shadow">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ScanLine className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-cairo text-sm font-medium text-foreground">{img.nameAr}</p>
                          <p className="text-xs text-muted-foreground">{img.nameEn} • <Badge variant="outline" className="font-cairo text-[10px] h-4">{imagingTypeLabels[img.type] || img.type}</Badge></p>
                        </div>
                      </div>
                      <PriceCell id={img.id} defaultPrice={img.defaultPrice} customPrice={imgPrices[img.id]} tab="imaging" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Procedures */}
          <TabsContent value="procedures">
            <CategoryFilter categories={getProcedureCategories()} active={activeCategory} onChange={setActiveCategory} />
            <div className="space-y-2 mt-3">
              {filterBySearch(catalogProcedures)
                .filter(p => activeCategory === 'all' || p.category === activeCategory)
                .map(proc => (
                  <Card key={proc.id} className="shadow-sm hover:shadow-card transition-shadow">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Syringe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-cairo text-sm font-medium text-foreground">{proc.nameAr}</p>
                          <p className="text-xs text-muted-foreground">
                            {proc.nameEn} • <Clock className="inline h-3 w-3" /> {proc.durationMin} د •
                            <Badge variant="outline" className="font-cairo text-[10px] h-4 mr-1">{proc.category}</Badge>
                          </p>
                          {proc.prepInstructions && <p className="font-cairo text-[10px] text-amber-600 mt-0.5">⚠️ {proc.prepInstructions}</p>}
                        </div>
                      </div>
                      <PriceCell id={proc.id} defaultPrice={proc.defaultPrice} customPrice={procPrices[proc.id]} tab="procedures" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Category filter chips
const CategoryFilter = ({ categories, active, onChange, labels }: {
  categories: string[]; active: string; onChange: (v: string) => void; labels?: Record<string, string>;
}) => (
  <div className="flex flex-wrap gap-1.5 mt-3">
    <Button size="sm" variant={active === 'all' ? 'default' : 'outline'} className="font-cairo text-xs h-7" onClick={() => onChange('all')}>الكل</Button>
    {categories.map(cat => (
      <Button key={cat} size="sm" variant={active === cat ? 'default' : 'outline'} className="font-cairo text-xs h-7" onClick={() => onChange(cat)}>
        {labels?.[cat] || cat}
      </Button>
    ))}
  </div>
);

export default DashboardServices;
