import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon,
  ChartLineData01Icon,
  BriefcaseDollarIcon,
  Wallet01Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import InvestmentSection from './components/investments/InvestmentSection';
import OtherInvestmentSection from './components/other-investments/OtherInvestmentSection';
import ExpenseSection from './components/expenses/ExpenseSection';
import DashboardSection from './components/dashboard/DashboardSection';
import SettingsSection from './components/settings/SettingsSection';

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',    icon: DashboardSquare01Icon },
  { to: '/investments', label: 'Investments',  icon: ChartLineData01Icon   },
  { to: '/other',       label: 'Other',        icon: BriefcaseDollarIcon   },
  { to: '/expenses',    label: 'Expenses',     icon: Wallet01Icon          },
  { to: '/settings',    label: 'Settings',     icon: Settings02Icon        },
];

function DockItem({ to, label, icon }: (typeof NAV_ITEMS)[number]) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200',
          'text-muted-foreground hover:text-foreground hover:scale-110',
          isActive && 'text-foreground scale-105',
        )
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={cn(
              'p-1.5 rounded-lg transition-colors duration-200',
              isActive
                ? 'bg-accent text-foreground'
                : 'group-hover:bg-accent/50',
            )}
          >
            <HugeiconsIcon icon={icon} size={17} />
          </div>
          <span className="text-[9px] tracking-wide">{label}</span>
          {isActive && (
            <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground select-none">
      <main className="flex-1 overflow-y-auto pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardSection />} />
          <Route path="/investments" element={<InvestmentSection />} />
          <Route path="/other" element={<OtherInvestmentSection />} />
          <Route path="/expenses" element={<ExpenseSection />} />
          <Route path="/settings" element={<SettingsSection />} />
        </Routes>
      </main>

      {/* Bottom dock */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4 pointer-events-none">
        <nav className="relative flex items-end gap-0.5 bg-background/80 backdrop-blur-xl border border-border/60 rounded-2xl px-2 py-1.5 shadow-2xl pointer-events-auto">
          {NAV_ITEMS.map((item) => (
            <DockItem key={item.to} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
