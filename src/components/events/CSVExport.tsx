import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Registration } from '@/data/eventsTypes';

interface CSVExportProps {
  registrations: Registration[];
  filename?: string;
}

/** Mask PII: show first 3 chars + *** */
const mask = (value: string) => {
  if (!value) return '***';
  if (value.length <= 3) return value + '***';
  return value.slice(0, 3) + '***';
};

const CSVExport = ({ registrations, filename = 'registrations' }: CSVExportProps) => {
  const handleExport = () => {
    const headers = ['case_code', 'patient_name_masked', 'phone_masked', 'schedule_time', 'status', 'created_at'];
    const rows = registrations.map(r => [
      r.caseCode,
      mask(r.patientInfo?.name || ''),
      mask(r.patientInfo?.phone || ''),
      r.scheduleId, // TODO: resolve to actual time
      r.status,
      r.createdAt,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Arabic
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="font-cairo gap-2">
      <Download className="h-4 w-4" />
      تصدير CSV
    </Button>
  );
};

export default CSVExport;
