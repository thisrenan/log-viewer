import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { Dashboard } from '@/components/Dashboard';
import { FilterBar } from '@/components/FilterBar';
import { LogGrid } from '@/components/LogGrid';
import { LogDetails } from '@/components/LogDetails';
import { useLogStore } from '@/stores/logStore';

const Index = () => {
  const { logs } = useLogStore();
  const hasLogs = logs.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {!hasLogs ? (
          <div className="max-w-xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Log Viewer</h2>
              <p className="text-muted-foreground">
                Importe seu arquivo de log para começar a análise
              </p>
            </div>
            <FileUpload />
          </div>
        ) : (
          <>
            <Dashboard />
            
            <FilterBar />
            
            <LogGrid />
          </>
        )}
      </main>
      
      <LogDetails />
    </div>
  );
};

export default Index;
