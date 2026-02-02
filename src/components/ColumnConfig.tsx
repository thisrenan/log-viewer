import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogStore } from '@/stores/logStore';

export function ColumnConfig() {
  const { columns, toggleColumn } = useLogStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-1" />
          Colunas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-2">
          {columns.map(col => (
            <label 
              key={col.field} 
              className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded"
            >
              <Checkbox
                checked={col.visible}
                onCheckedChange={() => toggleColumn(col.field)}
              />
              <span className="text-sm">{col.headerName}</span>
            </label>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
