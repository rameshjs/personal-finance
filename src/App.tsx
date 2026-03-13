import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import InvestmentSection from './components/investments/InvestmentSection';
import OtherInvestmentSection from './components/other-investments/OtherInvestmentSection';

const NAV_BASE =
  'px-4 py-2 text-xs tracking-widest text-muted-foreground border-b-2 border-transparent transition-colors';

function navClass({ isActive }: { isActive: boolean }) {
  return cn(NAV_BASE, isActive && 'border-primary text-foreground');
}

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground select-none">
      <header className="border-b border-border px-4 pt-3 flex gap-0 shrink-0">
        <NavLink to="/investments" className={navClass}>
          INVESTMENTS
        </NavLink>
        <NavLink to="/other" className={navClass}>
          OTHER
        </NavLink>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/investments" replace />} />
          <Route path="/investments" element={<InvestmentSection />} />
          <Route path="/other" element={<OtherInvestmentSection />} />
        </Routes>
      </main>
    </div>
  );
}
