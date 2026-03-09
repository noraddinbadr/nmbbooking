import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileImage, FileText, Trash2, Download, Loader2, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MedicalFileUploadProps {
  patientId: string;
  doctorId?: string;
  sessionId?: string;
  bookingId?: string;
  readOnly?: boolean;
}

const FILE_CATEGORIES = [
  { value: 'lab_result', label: 'نتيجة تحاليل', icon: '🧪' },
  { value: 'imaging', label: 'صورة أشعة', icon: '📷' },
  { value: 'medical_image', label: 'صورة طبية', icon: '🩺' },
  { value: 'report', label: 'تقرير طبي', icon: '📄' },
  { value: 'prescription', label: 'وصفة', icon: '💊' },
  { value: 'other', label: 'أخرى', icon: '📎' },
];

const categoryLabel = (cat: string) => FILE_CATEGORIES.find(c => c.value === cat) || FILE_CATEGORIES[5];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/dicom',
];

export const MedicalFileUpload = ({ patientId, doctorId, sessionId, bookingId, readOnly }: MedicalFileUploadProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('lab_result');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const queryKey = ['medical-files', patientId, sessionId];

  const { data: files = [], isLoading } = useQuery({
    queryKey,
    enabled: !!patientId,
    queryFn: async () => {
      let query = supabase
        .from('medical_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !user) return;

    const filesToUpload = Array.from(fileList);

    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'خطأ', description: `${file.name}: حجم الملف يجب أن يكون أقل من 10 ميجابايت`, variant: 'destructive' });
        continue;
      }
    }

    setUploading(true);

    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) continue;

      const ext = file.name.split('.').pop() || 'bin';
      const timestamp = Date.now();
      const filePath = `${patientId}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        toast({ title: 'خطأ في الرفع', description: `${file.name}: ${uploadError.message}`, variant: 'destructive' });
        continue;
      }

      const { error: metaError } = await supabase.from('medical_files').insert({
        patient_id: patientId,
        uploaded_by: user.id,
        doctor_id: doctorId || null,
        session_id: sessionId || null,
        booking_id: bookingId || null,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other',
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
        category: selectedCategory,
      });

      if (metaError) {
        toast({ title: 'خطأ', description: metaError.message, variant: 'destructive' });
      }
    }

    setUploading(false);
    setDescription('');
    e.target.value = '';
    queryClient.invalidateQueries({ queryKey });
    toast({ title: '✅ تم الرفع', description: `تم رفع ${filesToUpload.length} ملف بنجاح` });
  }, [user, patientId, doctorId, sessionId, bookingId, selectedCategory, description, queryClient, queryKey]);

  const handleDelete = async (fileId: string, filePath: string) => {
    await supabase.storage.from('medical-files').remove([filePath]);
    await supabase.from('medical_files').delete().eq('id', fileId);
    queryClient.invalidateQueries({ queryKey });
    toast({ title: '🗑️ تم الحذف', description: 'تم حذف الملف' });
  };

  const handleView = async (filePath: string, mimeType: string | null) => {
    const { data } = await supabase.storage.from('medical-files').createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      if (mimeType?.startsWith('image/')) {
        setPreviewUrl(data.signedUrl);
      } else {
        window.open(data.signedUrl, '_blank');
      }
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('medical-files').createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = fileName;
      a.click();
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-cairo text-sm flex items-center gap-2">
            <FileImage className="h-4 w-4 text-primary" />
            الملفات الطبية ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Upload Section */}
          {!readOnly && (
            <div className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
              <div className="flex flex-wrap gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="font-cairo w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="font-cairo text-xs">
                        {c.icon} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="وصف الملف (اختياري)..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="font-cairo flex-1 h-8 text-xs"
                />
              </div>
              <label className="cursor-pointer block">
                <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 py-3 hover:bg-primary/10 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-cairo text-sm text-primary font-medium">
                    {uploading ? 'جارٍ الرفع...' : 'اضغط لرفع ملفات (صور، PDF، أشعة)'}
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
              <p className="font-cairo text-[10px] text-muted-foreground text-center">حد أقصى 10 ميجابايت للملف الواحد</p>
            </div>
          )}

          {/* Files List */}
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : files.length === 0 ? (
            <p className="font-cairo text-xs text-muted-foreground text-center py-3">لا توجد ملفات طبية</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {files.map((file: any) => {
                const cat = categoryLabel(file.category);
                return (
                  <div key={file.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 group">
                    <span className="text-lg shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-cairo text-xs font-medium text-foreground truncate">{file.file_name}</p>
                      <div className="flex items-center gap-2 font-cairo text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="font-cairo text-[9px] h-4 px-1">{cat.label}</Badge>
                        {file.file_size && <span>{formatSize(file.file_size)}</span>}
                        <span>{new Date(file.created_at).toLocaleDateString('ar-YE')}</span>
                      </div>
                      {file.description && <p className="font-cairo text-[10px] text-muted-foreground mt-0.5">{file.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleView(file.file_path, file.mime_type)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(file.file_path, file.file_name)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {!readOnly && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(file.id, file.file_path)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-10 left-0 text-white hover:bg-white/20"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img src={previewUrl} alt="معاينة" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </>
  );
};

export default MedicalFileUpload;
