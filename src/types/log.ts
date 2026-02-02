export type LogLevel = 'Trace' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Critical' | 'None';

export interface LogState {
  Message: string;
  HttpMethod?: string;
  Uri?: string;
  ElapsedMilliseconds?: number;
  StatusCode?: number;
  [key: string]: unknown;
}

export interface LogScope {
  Message: string;
  HttpMethod?: string;
  Uri?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  id: string;
  Timestamp: string;
  EventId: number;
  LogLevel: LogLevel;
  Category: string;
  Message: string;
  State?: LogState;
  Scopes?: LogScope[];
  Exception?: string;
  // Extracted fields for easier filtering
  HttpMethod?: string;
  Uri?: string;
  StatusCode?: number;
  ElapsedMilliseconds?: number;
  Host?: string;
  Path?: string;
  // Original raw JSON
  _raw: string;
  // Line number in original file
  _lineNumber: number;
  // Parse error if any
  _parseError?: string;
}

export interface ParseResult {
  entries: LogEntry[];
  totalLines: number;
  parsedLines: number;
  errorLines: number;
  duration: number;
}

export interface FilterState {
  logLevels: LogLevel[];
  searchText: string;
  categories: string[];
  httpOnly: boolean;
  errorsOnly: boolean;
  slowRequestsThreshold: number | null;
  dateFrom: Date | null;
  dateTo: Date | null;
}

export interface LogStats {
  total: number;
  byLogLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
  avgElapsedMs: number;
  topSlowEndpoints: Array<{ uri: string; avgMs: number; maxMs: number; count: number }>;
  topCalledEndpoints: Array<{ uri: string; count: number }>;
  httpErrorRate: number;
  timeRange: { from: string; to: string } | null;
  slowestRequest: { uri: string; ms: number } | null;
}

export interface ColumnConfig {
  field: string;
  headerName: string;
  visible: boolean;
  width?: number;
}
