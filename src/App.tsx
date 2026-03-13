import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvestmentSection from './components/investments/InvestmentSection';

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground select-none">
      <Tabs defaultValue="investments" className="flex flex-col flex-1 overflow-hidden">
        <header className="border-b border-border px-4 pt-3">
          <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none">
            <TabsTrigger
              value="investments"
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs tracking-widest text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              INVESTMENTS
            </TabsTrigger>
          </TabsList>
        </header>

        <main className="flex-1 overflow-y-auto">
          <TabsContent value="investments" className="mt-0 h-full">
            <InvestmentSection />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
