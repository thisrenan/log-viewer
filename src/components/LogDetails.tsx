import { useMemo } from 'react';
import { X, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLogStore } from '@/stores/logStore';
import { formatTimestamp, formatDuration } from '@/lib/logParser';
import { useToast } from '@/hooks/use-toast';

export function LogDetails() {
  const { logs, selectedLogId, setSelectedLogId } = useLogStore();
  const { toast } = useToast();

  const selectedLog = useMemo(() => {
    if (!selectedLogId) return null;
    return logs.find(l => l.id === selectedLogId);
  }, [logs, selectedLogId]);

  if (!selectedLog) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const copyAsMarkdown = () => {
    const md = `## Log Entry

| Field | Value |
|-------|-------|
| Timestamp | ${selectedLog.Timestamp} |
| Level | ${selectedLog.LogLevel} |
| Category | ${selectedLog.Category} |
| Event ID | ${selectedLog.EventId} |
| Message | ${selectedLog.Message} |
${selectedLog.HttpMethod ? `| HTTP Method | ${selectedLog.HttpMethod} |` : ''}
${selectedLog.Uri ? `| URI | ${selectedLog.Uri} |` : ''}
${selectedLog.StatusCode ? `| Status Code | ${selectedLog.StatusCode} |` : ''}
${selectedLog.ElapsedMilliseconds ? `| Duration | ${formatDuration(selectedLog.ElapsedMilliseconds)} |` : ''}

### Raw JSON
\`\`\`json
${selectedLog._raw}
\`\`\`
`;
    copyToClipboard(md, 'Markdown');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l shadow-xl z-50 animate-slide-up">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Detalhes do Log</h3>
            <Badge variant="outline" className="text-xs">
              Linha {selectedLog._lineNumber}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copyAsMarkdown}>
              <Copy className="h-4 w-4 mr-1" />
              Markdown
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedLogId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Timestamp" value={formatTimestamp(selectedLog.Timestamp)} />
              <InfoField label="Level">
                <Badge className={`text-xs ${
                  selectedLog.LogLevel === 'Error' || selectedLog.LogLevel === 'Critical' 
                    ? 'bg-log-error text-white' 
                    : selectedLog.LogLevel === 'Warning'
                    ? 'bg-log-warning text-white'
                    : 'bg-log-info text-white'
                }`}>
                  {selectedLog.LogLevel}
                </Badge>
              </InfoField>
              <InfoField label="Event ID" value={selectedLog.EventId.toString()} />
              <InfoField 
                label="Category" 
                value={selectedLog.Category} 
                truncate 
                onCopy={() => copyToClipboard(selectedLog.Category, 'Category')}
              />
            </div>

            {/* Message */}
            <InfoField 
              label="Message" 
              value={selectedLog.Message} 
              multiline
              onCopy={() => copyToClipboard(selectedLog.Message, 'Message')}
            />

            {/* HTTP Details */}
            {(selectedLog.HttpMethod || selectedLog.Uri || selectedLog.StatusCode !== undefined) && (
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">HTTP Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedLog.HttpMethod && (
                    <InfoField label="Method">
                      <Badge variant="outline">{selectedLog.HttpMethod}</Badge>
                    </InfoField>
                  )}
                  {selectedLog.StatusCode !== undefined && (
                    <InfoField label="Status">
                      <Badge 
                        variant="outline" 
                        className={selectedLog.StatusCode >= 400 ? 'border-log-error text-log-error' : 'border-status-success text-status-success'}
                      >
                        {selectedLog.StatusCode}
                      </Badge>
                    </InfoField>
                  )}
                  {selectedLog.ElapsedMilliseconds !== undefined && (
                    <InfoField label="Duration" value={formatDuration(selectedLog.ElapsedMilliseconds)} />
                  )}
                </div>
                {selectedLog.Uri && (
                  <div className="mt-3">
                    <InfoField 
                      label="URI" 
                      value={selectedLog.Uri}
                      truncate
                      onCopy={() => copyToClipboard(selectedLog.Uri!, 'URI')}
                    />
                  </div>
                )}
              </div>
            )}

            {/* State */}
            {selectedLog.State && (
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">State</h4>
                <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedLog.State, null, 2)}
                </pre>
              </div>
            )}

            {/* Scopes */}
            {selectedLog.Scopes && selectedLog.Scopes.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Scopes</h4>
                <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedLog.Scopes, null, 2)}
                </pre>
              </div>
            )}

            {/* Exception */}
            {selectedLog.Exception && (
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 text-log-error">Exception</h4>
                <pre className="p-3 rounded-lg bg-log-error-bg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all text-log-error">
                  {selectedLog.Exception}
                </pre>
              </div>
            )}

            {/* Raw JSON */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Raw JSON</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(selectedLog._raw, 'JSON')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48">
                {JSON.stringify(JSON.parse(selectedLog._raw), null, 2)}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  truncate?: boolean;
  multiline?: boolean;
  onCopy?: () => void;
}

function InfoField({ label, value, children, truncate, multiline, onCopy }: InfoFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-foreground">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
      {children || (
        <p className={`text-sm ${truncate ? 'truncate' : ''} ${multiline ? 'whitespace-pre-wrap break-words' : ''}`}>
          {value}
        </p>
      )}
    </div>
  );
}
