import { FileText, Trash2, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogStore } from '@/stores/logStore';
import { formatBytes } from '@/lib/logParser';
import { ExportMenu } from './ExportMenu';
import { useState, useEffect } from 'react';

export function Header() {
  const { fileName, fileSize, logs, clearLogs } = useLogStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-foreground/10">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">HAVAN LOG VIEWER</h1>
              <p className="text-xs text-primary-foreground/70">Análise de Logs .NET</p>
            </div>
          </div>

          {/* File info and actions */}
          <div className="flex items-center gap-3">
            {fileName && (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-foreground/10 text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{fileName}</span>
                  <span className="text-primary-foreground/70">•</span>
                  <span className="text-primary-foreground/70">{formatBytes(fileSize)}</span>
                  <span className="text-primary-foreground/70">•</span>
                  <span className="text-primary-foreground/70">{logs.length.toLocaleString()} registros</span>
                </div>

                <ExportMenu />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Limpar</span>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
