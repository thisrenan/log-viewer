import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLogStore } from '@/stores/logStore';
import type { LogLevel } from '@/types/log';
import { 
  Search, 
  X, 
  Filter, 
  Wifi, 
  AlertCircle, 
  Clock,
  RotateCcw,
  ChevronDown,
  Layers
} from 'lucide-react';

const LOG_LEVEL_CONFIG: Record<LogLevel, { label: string; className: string }> = {
  Critical: { label: 'Critical', className: 'bg-log-error text-white hover:bg-log-error/80' },
  Error: { label: 'Error', className: 'bg-log-error text-white hover:bg-log-error/80' },
  Warning: { label: 'Warning', className: 'bg-log-warning text-white hover:bg-log-warning/80' },
  Information: { label: 'Info', className: 'bg-log-info text-white hover:bg-log-info/80' },
  Debug: { label: 'Debug', className: 'bg-log-debug text-white hover:bg-log-debug/80' },
  Trace: { label: 'Trace', className: 'bg-log-trace text-white hover:bg-log-trace/80' },
  None: { label: 'None', className: 'bg-muted text-muted-foreground hover:bg-muted/80' },
};

export function FilterBar() {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    toggleLogLevel, 
    getUniqueCategories,
    getFilteredLogs,
    logs 
  } = useLogStore();

  const [categorySearchText, setCategorySearchText] = useState('');

  const categories = useMemo(() => getUniqueCategories(), [logs, getUniqueCategories]);
  const filteredLogs = useMemo(() => getFilteredLogs(), [logs, filters, getFilteredLogs]);
  const filteredCount = filteredLogs.length;

  const filteredCategories = useMemo(() => {
    if (!categorySearchText) return categories;
    return categories.filter(cat => 
      cat.toLowerCase().includes(categorySearchText.toLowerCase())
    );
  }, [categories, categorySearchText]);
  
  const hasActiveFilters = 
    filters.searchText || 
    filters.categories.length > 0 || 
    filters.httpOnly || 
    filters.errorsOnly || 
    filters.slowRequestsThreshold !== null ||
    filters.logLevels.length < 7;

  const toggleCategory = (category: string) => {
    const current = filters.categories;
    const newCategories = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    setFilters({ categories: newCategories });
  };

  const clearCategories = () => {
    setFilters({ categories: [] });
  };

  if (logs.length === 0) return null;

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Filtros
        </h2>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            {filteredCount.toLocaleString()} de {logs.length.toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Search and Category */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em mensagem, categoria, URI..."
            value={filters.searchText}
            onChange={(e) => setFilters({ searchText: e.target.value })}
            className="pl-9 pr-9"
          />
          {filters.searchText && (
            <button
              onClick={() => setFilters({ searchText: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Multi-select Categories */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <div className="flex items-center gap-2 truncate">
                <Layers className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {filters.categories.length === 0 
                    ? 'Todas as Categorias' 
                    : `${filters.categories.length} selecionada${filters.categories.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-2" align="start">
            <div className="space-y-2">
              <Input
                placeholder="Buscar categoria..."
                value={categorySearchText}
                onChange={(e) => setCategorySearchText(e.target.value)}
                className="h-8"
              />
              {filters.categories.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCategories}
                  className="w-full text-xs"
                >
                  Limpar seleção ({filters.categories.length})
                </Button>
              )}
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {filteredCategories.map(cat => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.categories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                    />
                    <span className="text-sm truncate" title={cat}>
                      {cat.split('.').pop()}
                    </span>
                  </label>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Nenhuma categoria encontrada
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={filters.slowRequestsThreshold?.toString() || 'none'}
          onValueChange={(value) => setFilters({ 
            slowRequestsThreshold: value === 'none' ? null : parseInt(value) 
          })}
        >
          <SelectTrigger className="w-[160px]">
            <Clock className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tempo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Qualquer tempo</SelectItem>
            <SelectItem value="100">&gt; 100ms</SelectItem>
            <SelectItem value="500">&gt; 500ms</SelectItem>
            <SelectItem value="1000">&gt; 1s</SelectItem>
            <SelectItem value="5000">&gt; 5s</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log Level Toggles */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(LOG_LEVEL_CONFIG) as [LogLevel, { label: string; className: string }][]).map(([level, config]) => (
          <Button
            key={level}
            variant="outline"
            size="sm"
            onClick={() => toggleLogLevel(level)}
            className={`transition-all ${
              filters.logLevels.includes(level) 
                ? config.className 
                : 'opacity-40 hover:opacity-70'
            }`}
          >
            {config.label}
          </Button>
        ))}

        <div className="w-px bg-border mx-1" />

        <Button
          variant={filters.httpOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters({ httpOnly: !filters.httpOnly })}
          className={filters.httpOnly ? 'bg-primary' : ''}
        >
          <Wifi className="h-3 w-3 mr-1" />
          HTTP Only
        </Button>

        <Button
          variant={filters.errorsOnly ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setFilters({ errorsOnly: !filters.errorsOnly })}
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Erros HTTP
        </Button>

        {hasActiveFilters && (
          <>
            <div className="w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar Filtros
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
