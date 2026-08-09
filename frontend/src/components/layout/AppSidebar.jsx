import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileUser,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Sprout,
} from 'lucide-react';

import { primaryNavigation } from '../../app/navigation';
import { useAuth } from '../../context/auth-context';
import { cn } from '../../lib/utils';


const navigationIcons = {
  today: LayoutDashboard,
  jobs: BriefcaseBusiness,
  profile: FileUser,
  applications: ListChecks,
  growth: Sprout,
};


const AppSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-[#eef0f1] px-4 py-5 md:flex md:flex-col">
      <Link to="/dashboard" className="flex items-center gap-3 px-2" aria-label="CareerPilot Today">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#36454f] text-sm font-black tracking-tight text-white">
          CP
        </span>
        <span>
          <span className="block text-base font-bold tracking-[-0.02em] text-slate-950">CareerPilot</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Student workspace</span>
        </span>
      </Link>

      <nav className="mt-9 space-y-1" aria-label="Primary navigation">
        {primaryNavigation.map((item) => {
          const Icon = navigationIcons[item.id];
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.id}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-white text-[#36454f] shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-950',
              )}
            >
              <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-[#36454f]' : 'text-slate-400 group-hover:text-slate-700')} />
              <span>{item.label}</span>
              {item.id === 'jobs' && <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-slate-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
            location.pathname === '/settings'
              ? 'bg-white text-[#36454f] shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
              : 'text-slate-600 hover:bg-white/70 hover:text-slate-950',
          )}
        >
          <Settings className="h-[18px] w-[18px] text-slate-400" />
          Settings
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{user?.full_name || 'CareerPilot student'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
