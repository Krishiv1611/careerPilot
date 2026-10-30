import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { BriefcaseBusiness, FileUser, LayoutDashboard, ListChecks, Sprout } from 'lucide-react';

import { primaryNavigation } from '../../app/navigation';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div;

const navigationIcons = {
  today: LayoutDashboard,
  jobs: BriefcaseBusiness,
  profile: FileUser,
  applications: ListChecks,
  growth: Sprout,
};

const MobileNavigation = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-[#1E293B] bg-[#0B0F15]/95 px-1 py-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.6)] backdrop-blur-xl md:hidden"
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
              'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold select-none transition-colors duration-150',
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {isActive && (
              <MotionDiv
                layoutId="studio-mobile-nav-active"
                className="absolute inset-0 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-500/20 to-emerald-500/10 shadow-[0_0_12px_-2px_rgba(6,182,212,0.2)]"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 350, damping: 28 }
                }
              />
            )}
            <span className="relative z-10 flex flex-col items-center gap-1">
              <Icon
                className={cn(
                  'h-[18px] w-[18px] transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-400'
                )}
              />
              <span className="truncate">{item.id === 'profile' ? 'Profile' : item.label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
