import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, FilterState, LogStats, ColumnConfig, LogLevel } from '../types/log';

interface LogStore {
  // Data
  logs: LogEntry[];
  fileName: string | null;
  fileSize: number;
  parseTime: number;
  
  // Filters
  filters: FilterState;
  
  // Column configuration
  columns: ColumnConfig[];
  
  // UI State
  isLoading: boolean;
  selectedLogId: string | null;
  
  // Actions
  setLogs: (logs: LogEntry[], fileName: string, fileSize: number, parseTime: number) => void;
  clearLogs: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  toggleLogLevel: (level: LogLevel) => void;
  setColumns: (columns: ColumnConfig[]) => void;
  toggleColumn: (field: string) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedLogId: (id: string | null) => void;
  
  // Computed
  getFilteredLogs: () => LogEntry[];
  getStats: () => LogStats;
  getUniqueCategories: () => string[];
}

const defaultFilters: FilterState = {
  logLevels: ['Error', 'Warning', 'Information', 'Debug', 'Trace', 'Critical', 'None'],
  searchText: '',
  categories: [],
  httpOnly: false,
  errorsOnly: false,
  slowRequestsThreshold: null,
  dateFrom: null,
  dateTo: null
};

const defaultColumns: ColumnConfig[] = [
  { field: 'Timestamp', headerName: 'Timestamp', visible: true, width: 180 },
  { field: 'LogLevel', headerName: 'Level', visible: true, width: 100 },
  { field: 'Category', headerName: 'Category', visible: true, width: 250 },
  { field: 'EventId', headerName: 'Event ID', visible: false, width: 80 },
  { field: 'Message', headerName: 'Message', visible: true, width: 400 },
  { field: 'HttpMethod', headerName: 'Method', visible: true, width: 80 },
  { field: 'Host', headerName: 'Host', visible: true, width: 180 },
  { field: 'Path', headerName: 'Path', visible: true, width: 200 },
  { field: 'Uri', headerName: 'URI', visible: false, width: 300 },
  { field: 'StatusCode', headerName: 'Status', visible: true, width: 80 },
  { field: 'ElapsedMilliseconds', headerName: 'Duration (ms)', visible: true, width: 120 },
];

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      // Initial state
      logs: [],
      fileName: null,
      fileSize: 0,
      parseTime: 0,
      filters: defaultFilters,
      columns: defaultColumns,
      isLoading: false,
      selectedLogId: null,

      // Actions
      setLogs: (logs, fileName, fileSize, parseTime) => set({ 
        logs, 
        fileName, 
        fileSize, 
        parseTime,
        selectedLogId: null 
      }),
      
      clearLogs: () => set({ 
        logs: [], 
        fileName: null, 
        fileSize: 0, 
        parseTime: 0,
        filters: defaultFilters,
        selectedLogId: null
      }),
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      
      resetFilters: () => set({ filters: defaultFilters }),
      
      toggleLogLevel: (level) => set((state) => {
        const current = state.filters.logLevels;
        const newLevels = current.includes(level)
          ? current.filter(l => l !== level)
          : [...current, level];
        return { filters: { ...state.filters, logLevels: newLevels } };
      }),
      
      setColumns: (columns) => set({ columns }),
      
      toggleColumn: (field) => set((state) => ({
        columns: state.columns.map(col =>
          col.field === field ? { ...col, visible: !col.visible } : col
        )
      })),
      
      setIsLoading: (isLoading) => set({ isLoading }),
      
      setSelectedLogId: (selectedLogId) => set({ selectedLogId }),

      // Computed
      getFilteredLogs: () => {
        const { logs, filters } = get();
        
        return logs.filter(log => {
          // LogLevel filter
          if (!filters.logLevels.includes(log.LogLevel)) return false;
          
          // Search text (includes Message, Category, URI, State, and Scopes)
          if (filters.searchText) {
            const search = filters.searchText.toLowerCase();
            
            // Stringify State and Scopes for searchability
            const stateStr = log.State ? JSON.stringify(log.State) : '';
            const scopesStr = log.Scopes ? JSON.stringify(log.Scopes) : '';
            
            const searchable = `${log.Message} ${log.Category} ${log.Uri || ''} ${stateStr} ${scopesStr}`.toLowerCase();
            if (!searchable.includes(search)) return false;
          }
          
          // Categories filter (multi-select)
          if (filters.categories.length > 0 && !filters.categories.includes(log.Category)) return false;
          
          // HTTP only
          if (filters.httpOnly && !log.HttpMethod) return false;
          
          // Errors only (HTTP status >= 400)
          if (filters.errorsOnly) {
            if (log.StatusCode && log.StatusCode < 400) return false;
            if (!log.StatusCode && log.LogLevel !== 'Error' && log.LogLevel !== 'Critical') return false;
          }
          
          // Slow requests
          if (filters.slowRequestsThreshold !== null && log.ElapsedMilliseconds) {
            if (log.ElapsedMilliseconds < filters.slowRequestsThreshold) return false;
          }
          
          // Date range
          if (filters.dateFrom || filters.dateTo) {
            const logDate = new Date(log.Timestamp);
            if (filters.dateFrom && logDate < filters.dateFrom) return false;
            if (filters.dateTo && logDate > filters.dateTo) return false;
          }
          
          return true;
        });
      },
      
      getStats: () => {
        const logs = get().logs;
        
        const byLogLevel: Record<LogLevel, number> = {
          Trace: 0, Debug: 0, Information: 0, Warning: 0, Error: 0, Critical: 0, None: 0
        };
        const byCategory: Record<string, number> = {};
        const endpointStats: Record<string, { totalMs: number; count: number; maxMs: number }> = {};
        let slowestRequest: { uri: string; ms: number } | null = null;
        let totalElapsedMs = 0;
        let elapsedCount = 0;
        let httpErrors = 0;
        let httpTotal = 0;
        
        for (const log of logs) {
          // By level
          byLogLevel[log.LogLevel] = (byLogLevel[log.LogLevel] || 0) + 1;
          
          // By category
          byCategory[log.Category] = (byCategory[log.Category] || 0) + 1;
          
          // Elapsed time
          if (log.ElapsedMilliseconds !== undefined) {
            totalElapsedMs += log.ElapsedMilliseconds;
            elapsedCount++;
            
            // Track slowest individual request
            if (!slowestRequest || log.ElapsedMilliseconds > slowestRequest.ms) {
              slowestRequest = { uri: log.Uri || log.Path || 'Unknown', ms: log.ElapsedMilliseconds };
            }
            
            if (log.Uri) {
              if (!endpointStats[log.Uri]) {
                endpointStats[log.Uri] = { totalMs: 0, count: 0, maxMs: 0 };
              }
              endpointStats[log.Uri].totalMs += log.ElapsedMilliseconds;
              endpointStats[log.Uri].count++;
              endpointStats[log.Uri].maxMs = Math.max(endpointStats[log.Uri].maxMs, log.ElapsedMilliseconds);
            }
          }
          
          // HTTP errors
          if (log.StatusCode !== undefined) {
            httpTotal++;
            if (log.StatusCode >= 400) httpErrors++;
          }
        }
        
        // Top slow endpoints (by max time, not average)
        const topSlowEndpoints = Object.entries(endpointStats)
          .map(([uri, stats]) => ({
            uri,
            avgMs: stats.totalMs / stats.count,
            maxMs: stats.maxMs,
            count: stats.count
          }))
          .sort((a, b) => b.maxMs - a.maxMs)
          .slice(0, 5);
        
        // Top called endpoints
        const topCalledEndpoints = Object.entries(endpointStats)
          .map(([uri, stats]) => ({ uri, count: stats.count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Time range
        let timeRange: { from: string; to: string } | null = null;
        if (logs.length > 0) {
          const sorted = [...logs].sort((a, b) => 
            new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()
          );
          timeRange = {
            from: sorted[0].Timestamp,
            to: sorted[sorted.length - 1].Timestamp
          };
        }
        
        return {
          total: logs.length,
          byLogLevel,
          byCategory,
          avgElapsedMs: elapsedCount > 0 ? totalElapsedMs / elapsedCount : 0,
          topSlowEndpoints,
          topCalledEndpoints,
          httpErrorRate: httpTotal > 0 ? (httpErrors / httpTotal) * 100 : 0,
          timeRange,
          slowestRequest
        };
      },
      
      getUniqueCategories: () => {
        const logs = get().logs;
        return [...new Set(logs.map(l => l.Category))].sort();
      }
    }),
    {
      name: 'havan-log-viewer-storage',
      partialize: (state) => ({ columns: state.columns }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<LogStore>;
        // Merge persisted columns with default columns to include new ones
        const mergedColumns = defaultColumns.map(defaultCol => {
          const persistedCol = persisted.columns?.find(c => c.field === defaultCol.field);
          return persistedCol || defaultCol;
        });
        return {
          ...currentState,
          ...persisted,
          columns: mergedColumns
        };
      }
    }
  )
);
