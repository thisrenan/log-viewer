import type { ParseResult } from '../types/log';

export function parseLogsInWorker(content: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/logParser.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<{ type: string; data?: ParseResult; error?: string }>) => {
      const { type, data, error } = e.data;
      
      if (type === 'success' && data) {
        resolve(data);
      } else if (type === 'error') {
        reject(new Error(error || 'Parse failed'));
      }
      
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage({ content });
  });
}

export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const formatted = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${formatted}.${ms}`;
  } catch {
    return timestamp;
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}min`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
