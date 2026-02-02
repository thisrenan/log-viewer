import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLogStore } from '@/stores/logStore';
import { formatDuration, formatTimestamp } from '@/lib/logParser';
import { 
  FileText, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  TrendingUp,
  Activity
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'error' | 'warning' | 'info' | 'success';
}

function StatCard({ title, value, subtitle, icon, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'bg-card border-border',
    error: 'bg-log-error-bg border-log-error/30',
    warning: 'bg-log-warning-bg border-log-warning/30',
    info: 'bg-log-info-bg border-log-info/30',
    success: 'bg-status-success-bg border-status-success/30'
  };

  const iconClasses = {
    default: 'text-muted-foreground',
    error: 'text-log-error',
    warning: 'text-log-warning',
    info: 'text-log-info',
    success: 'text-status-success'
  };

  return (
    <Card className={`border ${variantClasses[variant]} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-background/50 ${iconClasses[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { logs, getStats, getFilteredLogs } = useLogStore();
  
  const stats = useMemo(() => getStats(), [logs]);
  const filteredCount = useMemo(() => getFilteredLogs().length, [logs, getFilteredLogs]);

  if (logs.length === 0) return null;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Dashboard
        </h2>
        {stats.timeRange && (
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(stats.timeRange.from)} → {formatTimestamp(stats.timeRange.to)}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          title="Total"
          value={stats.total.toLocaleString()}
          subtitle={filteredCount !== stats.total ? `${filteredCount.toLocaleString()} filtrados` : undefined}
          icon={<FileText className="h-5 w-5" />}
        />
        
        <StatCard
          title="Errors"
          value={stats.byLogLevel.Error + stats.byLogLevel.Critical}
          variant={stats.byLogLevel.Error + stats.byLogLevel.Critical > 0 ? 'error' : 'default'}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        
        <StatCard
          title="Warnings"
          value={stats.byLogLevel.Warning}
          variant={stats.byLogLevel.Warning > 0 ? 'warning' : 'default'}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        
        <StatCard
          title="Information"
          value={stats.byLogLevel.Information}
          variant="info"
          icon={<Info className="h-5 w-5" />}
        />
        
        <StatCard
          title="Tempo Médio"
          value={formatDuration(stats.avgElapsedMs)}
          icon={<Clock className="h-5 w-5" />}
        />
        
        <StatCard
          title="Taxa de Erro HTTP"
          value={`${stats.httpErrorRate.toFixed(1)}%`}
          variant={stats.httpErrorRate > 5 ? 'error' : stats.httpErrorRate > 1 ? 'warning' : 'success'}
          icon={<Activity className="h-5 w-5" />}
        />
        
        <StatCard
          title="Mais Lento"
          value={stats.slowestRequest ? formatDuration(stats.slowestRequest.ms) : '-'}
          subtitle={stats.slowestRequest?.uri.split('/').pop()}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
