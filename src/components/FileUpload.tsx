import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLogStore } from '@/stores/logStore';
import { parseLogsInWorker, formatBytes } from '@/lib/logParser';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileLoaded?: () => void;
}

export function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; size: number; preview: string; file: File } | null>(null);
  const { setLogs, setIsLoading, isLoading } = useLogStore();
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(txt|log|jsonl?)$/i)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo .txt, .log ou .jsonl',
        variant: 'destructive'
      });
      return;
    }

    // Preview first
    const previewContent = await file.slice(0, 2000).text();
    setPreviewFile({
      name: file.name,
      size: file.size,
      preview: previewContent,
      file: file
    });
  }, [toast]);

  const processFile = useCallback(async () => {
    if (!previewFile) return;
    
    setIsLoading(true);
    
    try {
      const file = previewFile.file;
      const content = await file.text();
      const result = await parseLogsInWorker(content);
      
      setLogs(result.entries, file.name, file.size, result.duration);
      setPreviewFile(null);
      
      toast({
        title: 'Arquivo importado',
        description: `${result.parsedLines.toLocaleString()} registros carregados em ${result.duration.toFixed(0)}ms`,
      });
      
      onFileLoaded?.();
    } catch (error) {
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [previewFile, setLogs, setIsLoading, toast, onFileLoaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (previewFile) {
    return (
      <Card className="border-2 border-primary/20 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{previewFile.name}</h3>
                <p className="text-sm text-muted-foreground">{formatBytes(previewFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewFile(null)}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview do conteúdo:</p>
            <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto max-h-32 text-foreground/80">
              {previewFile.preview}
              {previewFile.size > 2000 && '\n...'}
            </pre>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPreviewFile(null)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={processFile}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                'Importar Arquivo'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`p-4 rounded-full mb-4 transition-colors ${
            isDragging ? 'bg-primary/20' : 'bg-muted'
          }`}>
            <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <h3 className="text-lg font-semibold mb-1">Importar Arquivo de Log</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste e solte um arquivo ou clique para selecionar
          </p>
          
          <input
            id="file-input"
            type="file"
            accept=".txt,.log,.json,.jsonl"
            className="hidden"
            onChange={handleInputChange}
          />
          
          <Button asChild variant="outline">
            <label htmlFor="file-input" className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </label>
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            Formatos suportados: .txt, .log, .jsonl (até 50MB)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
