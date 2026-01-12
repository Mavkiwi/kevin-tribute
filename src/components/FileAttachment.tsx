import { useRef } from 'react';
import { Paperclip, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileAttachmentProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileAttachment({ file, onFileChange }: FileAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleRemove = () => {
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept="*/*"
      />
      
      {file ? (
        <div className="glass-card p-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleClick}
          className="w-full gap-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5"
        >
          <Paperclip className="w-4 h-4" />
          Attach File
        </Button>
      )}
    </div>
  );
}
