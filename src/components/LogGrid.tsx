import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, RowClassParams, GridReadyEvent, CellClickedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useLogStore } from '@/stores/logStore';
import type { LogEntry, LogLevel } from '@/types/log';
import { formatTimestamp, formatDuration } from '@/lib/logParser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { ColumnConfig } from './ColumnConfig';

const LogLevelCellRenderer = ({ value }: { value: LogLevel }) => {
  const config: Record<LogLevel, { className: string }> = {
    Critical: { className: 'bg-log-error text-white' },
    Error: { className: 'bg-log-error text-white' },
    Warning: { className: 'bg-log-warning text-white' },
    Information: { className: 'bg-log-info text-white' },
    Debug: { className: 'bg-log-debug text-white' },
    Trace: { className: 'bg-log-trace text-white' },
    None: { className: 'bg-muted text-muted-foreground' },
  };

  return (
    <Badge className={`${config[value]?.className || ''} text-xs font-medium`}>
      {value}
    </Badge>
  );
};

const StatusCodeCellRenderer = ({ value }: { value: number | undefined }) => {
  if (value === undefined) return null;
  
  const isError = value >= 400;
  const isSuccess = value >= 200 && value < 300;
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-mono ${
        isError ? 'border-log-error text-log-error' : 
        isSuccess ? 'border-status-success text-status-success' : ''
      }`}
    >
      {value}
    </Badge>
  );
};

const DurationCellRenderer = ({ value }: { value: number | undefined }) => {
  if (value === undefined) return null;
  
  const isSlow = value > 1000;
  const isVerySlow = value > 5000;
  
  return (
    <span className={`font-mono text-xs ${
      isVerySlow ? 'text-log-error font-semibold' :
      isSlow ? 'text-log-warning' : 
      'text-muted-foreground'
    }`}>
      {formatDuration(value)}
    </span>
  );
};

export function LogGrid() {
  const gridRef = useRef<AgGridReact<LogEntry>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { getFilteredLogs, columns, setSelectedLogId, logs, filters } = useLogStore();
  
  const rowData = useMemo(() => getFilteredLogs(), [logs, filters, getFilteredLogs]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Resize grid when fullscreen changes
  useEffect(() => {
    if (gridRef.current?.api) {
      setTimeout(() => {
        gridRef.current?.api?.sizeColumnsToFit();
      }, 100);
    }
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const columnDefs = useMemo<ColDef<LogEntry>[]>(() => {
    const visibleColumns = columns.filter(c => c.visible);
    
    return visibleColumns.map(col => {
      const base: ColDef<LogEntry> = {
        field: col.field as keyof LogEntry,
        headerName: col.headerName,
        width: col.width,
        sortable: true,
        filter: true,
        resizable: true,
      };

      switch (col.field) {
        case 'Timestamp':
          return {
            ...base,
            valueFormatter: ({ value }) => formatTimestamp(value),
            filter: 'agDateColumnFilter',
            filterParams: {
              suppressAndOrCondition: true,
              comparator: (filterDate: Date, cellValue: string) => {
                if (!cellValue) return -1;
                const cellDate = new Date(cellValue);
                const filterTime = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate()).getTime();
                const cellTime = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()).getTime();
                if (cellTime < filterTime) return -1;
                if (cellTime > filterTime) return 1;
                return 0;
              },
            },
          };
        case 'LogLevel':
          return {
            ...base,
            cellRenderer: LogLevelCellRenderer,
            filter: 'agSetColumnFilter',
          };
        case 'StatusCode':
          return {
            ...base,
            cellRenderer: StatusCodeCellRenderer,
            filter: 'agNumberColumnFilter',
          };
        case 'ElapsedMilliseconds':
          return {
            ...base,
            cellRenderer: DurationCellRenderer,
            filter: 'agNumberColumnFilter',
          };
        case 'Message':
          return {
            ...base,
            flex: 1,
            minWidth: 300,
            tooltipField: 'Message',
          };
        case 'Category':
          return {
            ...base,
            valueFormatter: ({ value }) => value?.split('.').slice(-2).join('.') || value,
            tooltipField: 'Category',
          };
        case 'Uri':
          return {
            ...base,
            tooltipField: 'Uri',
            valueFormatter: ({ value }) => {
              if (!value) return '';
              try {
                const url = new URL(value);
                return url.pathname + url.search;
              } catch {
                return value;
              }
            },
          };
        default:
          return base;
      }
    });
  }, [columns]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const getRowClass = useCallback((params: RowClassParams<LogEntry>) => {
    if (!params.data) return '';
    
    switch (params.data.LogLevel) {
      case 'Error':
      case 'Critical':
        return 'log-row-error';
      case 'Warning':
        return 'log-row-warning';
      default:
        return '';
    }
  }, []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  const onCellClicked = useCallback((event: CellClickedEvent<LogEntry>) => {
    if (event.data) {
      setSelectedLogId(event.data.id);
    }
  }, [setSelectedLogId]);

  if (logs.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={`animate-fade-in transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-background p-4 flex flex-col' 
          : 'flex-1'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Registros ({rowData.length.toLocaleString()})
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="gap-2"
            title={isFullscreen ? 'Sair da tela cheia (ESC)' : 'Tela cheia'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </Button>
          <ColumnConfig />
        </div>
      </div>
      
      <div className={`ag-theme-alpine rounded-lg overflow-hidden border ${
        isFullscreen ? 'flex-1' : 'h-[calc(100vh-380px)] min-h-[400px]'
      }`}>
        <AgGridReact<LogEntry>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowClass={getRowClass}
          onGridReady={onGridReady}
          onCellClicked={onCellClicked}
          rowSelection="single"
          animateRows={true}
          pagination={true}
          paginationPageSize={100}
          paginationPageSizeSelector={[50, 100, 250, 500]}
          suppressRowHoverHighlight={false}
          enableCellTextSelection={true}
          tooltipShowDelay={500}
        />
      </div>
    </div>
  );
}
