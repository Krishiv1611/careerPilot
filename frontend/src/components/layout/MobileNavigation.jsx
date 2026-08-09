import { Link, useLocation } from 'react-router-dom';
import { BriefcaseBusiness, FileUser, LayoutDashboard, ListChecks, Sprout } from 'lucide-react';

import { primaryNavigation } from '../../app/navigation';
import { cn } from '../../lib/utils';


const navigationIcons = {
  today: LayoutDashboard,
  jobs: BriefcaseBusiness,
  profile: FileUser,
  applications: ListChecks,
  growth: Sprout,
};


const MobileNavigation = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 px-1 py-1.5 shadow-[0_14px_36px_rgba(15,23,42,0.16)] backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      {primaryNavigation.map((item) => {
        const Icon = navigationIcons[item.id];
        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

        return (
          <Link
            key={item.id}
            to={item.path}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors',
              isActive ? 'bg-[#eef0f1] text-[#36454f]' : 'text-slate-500',
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="truncate">{item.id === 'profile' ? 'Profile' : item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
