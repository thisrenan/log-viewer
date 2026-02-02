import type { LogEntry, ParseResult, LogLevel } from '../types/log';

const LOG_LEVELS: LogLevel[] = ['Trace', 'Debug', 'Information', 'Warning', 'Error', 'Critical', 'None'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function parseLogLine(line: string, lineNumber: number): LogEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const json = JSON.parse(trimmed);
    
    // Validate required fields
    if (!json.Timestamp || !json.LogLevel) {
      return {
        id: generateId(),
        Timestamp: json.Timestamp || new Date().toISOString(),
        EventId: json.EventId || 0,
        LogLevel: (LOG_LEVELS.includes(json.LogLevel) ? json.LogLevel : 'Information') as LogLevel,
        Category: json.Category || 'Unknown',
        Message: json.Message || trimmed,
        State: json.State,
        Scopes: json.Scopes,
        Exception: json.Exception,
        HttpMethod: json.State?.HttpMethod || json.State?.Method || json.Scopes?.[0]?.HttpMethod,
        Uri: json.State?.Uri || json.Scopes?.[0]?.Uri,
        StatusCode: json.State?.StatusCode,
        ElapsedMilliseconds: json.State?.ElapsedMilliseconds,
        Host: json.State?.Host,
        Path: json.State?.Path,
        _raw: trimmed,
        _lineNumber: lineNumber,
        _parseError: 'Missing required fields'
      };
    }

    return {
      id: generateId(),
      Timestamp: json.Timestamp,
      EventId: json.EventId || 0,
      LogLevel: (LOG_LEVELS.includes(json.LogLevel) ? json.LogLevel : 'Information') as LogLevel,
      Category: json.Category || 'Unknown',
      Message: json.Message || '',
      State: json.State,
      Scopes: json.Scopes,
      Exception: json.Exception,
      HttpMethod: json.State?.HttpMethod || json.State?.Method || json.Scopes?.[0]?.HttpMethod,
      Uri: json.State?.Uri || json.Scopes?.[0]?.Uri,
      StatusCode: json.State?.StatusCode,
      ElapsedMilliseconds: json.State?.ElapsedMilliseconds,
      Host: json.State?.Host,
      Path: json.State?.Path,
      _raw: trimmed,
      _lineNumber: lineNumber
    };
  } catch {
    // Try to extract JSON objects from the line (multiple JSONs on one line)
    return null;
  }
}

function splitJsonObjects(content: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let currentStart = -1;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '{') {
      if (depth === 0) {
        currentStart = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && currentStart !== -1) {
        results.push(content.substring(currentStart, i + 1));
        currentStart = -1;
      }
    }
  }
  
  return results;
}

function parseContent(content: string): ParseResult {
  const startTime = performance.now();
  const entries: LogEntry[] = [];
  let parsedLines = 0;
  let errorLines = 0;
  
  // First try line by line
  const lines = content.split('\n');
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if line contains multiple JSON objects
    if (trimmed.includes('} {')) {
      const jsonObjects = splitJsonObjects(trimmed);
      for (const jsonStr of jsonObjects) {
        const entry = parseLogLine(jsonStr, lineNumber);
        if (entry) {
          entries.push(entry);
          parsedLines++;
        } else {
          errorLines++;
        }
      }
    } else {
      const entry = parseLogLine(trimmed, lineNumber);
      if (entry) {
        entries.push(entry);
        parsedLines++;
      } else if (trimmed.startsWith('{')) {
        errorLines++;
      }
    }
  }
  
  const duration = performance.now() - startTime;
  
  return {
    entries,
    totalLines: lineNumber,
    parsedLines,
    errorLines,
    duration
  };
}

self.onmessage = (e: MessageEvent<{ content: string }>) => {
  const { content } = e.data;
  
  try {
    const result = parseContent(content);
    self.postMessage({ type: 'success', data: result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown parse error' 
    });
  }
};

export {};
