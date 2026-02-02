import { useMemo } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogStore } from '@/stores/logStore';
import { useToast } from '@/hooks/use-toast';
import { formatTimestamp, formatDuration } from '@/lib/logParser';
import * as XLSX from 'xlsx';

export function ExportMenu() {
  const { getFilteredLogs, filters, logs } = useLogStore();
  const { toast } = useToast();
  
  const filteredLogs = useMemo(() => getFilteredLogs(), [logs, filters, getFilteredLogs]);

  const exportToCSV = () => {
    const headers = ['Timestamp', 'LogLevel', 'Category', 'EventId', 'Message', 'HttpMethod', 'Uri', 'StatusCode', 'ElapsedMilliseconds'];
    const rows = filteredLogs.map(log => [
      log.Timestamp,
      log.LogLevel,
      log.Category,
      log.EventId,
      `"${log.Message.replace(/"/g, '""')}"`,
      log.HttpMethod || '',
      log.Uri || '',
      log.StatusCode ?? '',
      log.ElapsedMilliseconds ?? ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, 'logs-export.csv', 'text/csv');
    toast({ title: `${filteredLogs.length} registros exportados para CSV` });
  };

  const exportToExcel = () => {
    const data = filteredLogs.map(log => ({
      Timestamp: formatTimestamp(log.Timestamp),
      LogLevel: log.LogLevel,
      Category: log.Category,
      EventId: log.EventId,
      Message: log.Message,
      HttpMethod: log.HttpMethod || '',
      Uri: log.Uri || '',
      StatusCode: log.StatusCode ?? '',
      'Duration (ms)': log.ElapsedMilliseconds ?? ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs');
    
    // Style header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) continue;
      ws[address].s = { font: { bold: true }, fill: { fgColor: { rgb: '003580' } } };
    }

    XLSX.writeFile(wb, 'logs-export.xlsx');
    toast({ title: `${filteredLogs.length} registros exportados para Excel` });
  };

  const exportToJSON = () => {
    const data = filteredLogs.map(log => ({
      Timestamp: log.Timestamp,
      LogLevel: log.LogLevel,
      Category: log.Category,
      EventId: log.EventId,
      Message: log.Message,
      HttpMethod: log.HttpMethod,
      Uri: log.Uri,
      StatusCode: log.StatusCode,
      ElapsedMilliseconds: log.ElapsedMilliseconds,
      State: log.State,
      Scopes: log.Scopes
    }));

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'logs-export.json', 'application/json');
    toast({ title: `${filteredLogs.length} registros exportados para JSON` });
  };

  const exportToMarkdown = () => {
    let md = `# Log Export\n\n`;
    md += `**Total:** ${filteredLogs.length} registros\n`;
    md += `**Exportado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    md += `---\n\n`;

    for (const log of filteredLogs.slice(0, 100)) { // Limit to 100 for markdown
      md += `### ${formatTimestamp(log.Timestamp)} - ${log.LogLevel}\n\n`;
      md += `**Category:** \`${log.Category}\`\n\n`;
      md += `**Message:** ${log.Message}\n\n`;
      
      if (log.HttpMethod || log.Uri) {
        md += `**HTTP:** ${log.HttpMethod || ''} ${log.Uri || ''}\n`;
        if (log.StatusCode) md += ` → Status: ${log.StatusCode}`;
        if (log.ElapsedMilliseconds) md += ` (${formatDuration(log.ElapsedMilliseconds)})`;
        md += `\n\n`;
      }
      
      md += `---\n\n`;
    }

    if (filteredLogs.length > 100) {
      md += `\n*... e mais ${filteredLogs.length - 100} registros*\n`;
    }

    downloadFile(md, 'logs-export.md', 'text/markdown');
    toast({ title: `Markdown exportado (primeiros 100 de ${filteredLogs.length})` });
  };

  const copyFiltersState = () => {
    const state = {
      filters,
      timestamp: new Date().toISOString(),
      totalFiltered: filteredLogs.length
    };
    navigator.clipboard.writeText(JSON.stringify(state, null, 2));
    toast({ title: 'Estado dos filtros copiado!' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
          <Download className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToMarkdown}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar Markdown
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyFiltersState}>
          <Share2 className="h-4 w-4 mr-2" />
          Copiar Estado
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
