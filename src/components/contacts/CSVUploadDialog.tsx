import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

interface ColumnMapping {
  name: string;
  company: string;
  phone: string;
  email: string;
}

const DB_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'company', label: 'Company', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
] as const;

export function CSVUploadDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: CSVUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    company: '',
    phone: '',
    email: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'select' | 'map' | 'confirm'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      // Simple CSV parsing - handles basic quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    return { headers, rows };
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);
      
      if (headers.length === 0) {
        toast({
          title: 'Empty file',
          description: 'The CSV file appears to be empty.',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
      setCsvHeaders(headers);
      setCsvData(rows);
      
      // Auto-map columns if names match
      const autoMapping: ColumnMapping = { name: '', company: '', phone: '', email: '' };
      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('name') && !autoMapping.name) autoMapping.name = header;
        if (lowerHeader.includes('company') || lowerHeader.includes('organization')) autoMapping.company = header;
        if (lowerHeader.includes('phone') || lowerHeader.includes('tel')) autoMapping.phone = header;
        if (lowerHeader.includes('email') || lowerHeader.includes('mail')) autoMapping.email = header;
      });
      setMapping(autoMapping);
      setStep('map');
    };
    reader.readAsText(selectedFile);
  }

  async function handleUpload() {
    if (!mapping.name) {
      toast({
        title: 'Name column required',
        description: 'Please map the Name field to a CSV column.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const nameIndex = csvHeaders.indexOf(mapping.name);
      const companyIndex = mapping.company ? csvHeaders.indexOf(mapping.company) : -1;
      const phoneIndex = mapping.phone ? csvHeaders.indexOf(mapping.phone) : -1;
      const emailIndex = mapping.email ? csvHeaders.indexOf(mapping.email) : -1;

      const contacts = csvData
        .filter((row) => row[nameIndex]?.trim())
        .map((row) => ({
          client_id: clientId,
          name: row[nameIndex]?.trim() || '',
          company: companyIndex >= 0 ? row[companyIndex]?.trim() || null : null,
          phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() || null : null,
          email: emailIndex >= 0 ? row[emailIndex]?.trim() || null : null,
        }));

      if (contacts.length === 0) {
        toast({
          title: 'No valid contacts',
          description: 'No contacts with names found in the CSV.',
          variant: 'destructive',
        });
        return;
      }

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        const { error } = await supabase.from('contacts').insert(batch);
        if (error) throw error;
      }

      toast({
        title: 'Contacts uploaded',
        description: `Successfully imported ${contacts.length} contacts.`,
      });
      
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to upload contacts:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to import contacts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleClose() {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({ name: '', company: '', phone: '', email: '' });
    setStep('select');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Contacts</DialogTitle>
          <DialogDescription>
            Import contacts from a CSV file. Map your columns to database fields.
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Click to select a CSV file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or drag and drop
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {step === 'map' && file && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({csvData.length} rows)
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 w-6 p-0"
                onClick={() => setStep('select')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Map CSV columns to fields</Label>
              {DB_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <span className="text-sm w-24">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </span>
                  <Select
                    value={mapping[field.key as keyof ColumnMapping]}
                    onValueChange={(value) =>
                      setMapping((prev) => ({ ...prev, [field.key]: value }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Skip —</SelectItem>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping[field.key as keyof ColumnMapping] && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleUpload} disabled={!mapping.name || isUploading} className="flex-1">
                {isUploading ? 'Uploading...' : `Import ${csvData.length} Contacts`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
