import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileUser,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  ShieldCheck,
  Sprout,
} from 'lucide-react';

import { primaryNavigation } from '../../app/navigation';
import { useAuth } from '../../context/auth-context';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div;

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
  const shouldReduceMotion = useReducedMotion();

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-[#1E293B] bg-[#0B0F15]/95 px-4 py-5 backdrop-blur-md md:flex">
      {/* Studio Brand & Header */}
      <Link to="/dashboard" className="flex items-center gap-3 px-2 focus:outline-none" aria-label="CareerPilot Today">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 text-sm font-black tracking-tight text-cyan-400 shadow-sm shadow-cyan-500/10">
          CP
        </div>
        <div className="min-w-0">
          <span className="block text-base font-bold tracking-tight text-white">CareerPilot</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              STUDIO OS
            </span>
          </div>
        </div>
      </Link>

      {/* Primary Navigation */}
      <nav className="mt-8 space-y-1.5" aria-label="Primary navigation">
        {primaryNavigation.map((item) => {
          const Icon = navigationIcons[item.id];
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.id}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
                isActive ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              )}
            >
              {isActive && (
                <MotionDiv
                  layoutId="studio-sidebar-active"
                  className="absolute inset-0 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 350, damping: 28 }
                  }
                />
              )}
              <span className="relative z-10 flex w-full items-center gap-3">
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] transition-colors',
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span>{item.label}</span>
                {item.id === 'jobs' && (
                  <ArrowUpRight
                    className={cn(
                      'ml-auto h-3.5 w-3.5 transition-colors',
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Studio Dock Footer */}
      <div className="mt-auto space-y-3 pt-4">
        <Link
          to="/settings"
          aria-current={location.pathname === '/settings' ? 'page' : undefined}
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
            location.pathname === '/settings' ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
          )}
        >
          {location.pathname === '/settings' && (
            <MotionDiv
              layoutId="studio-sidebar-active"
              className="absolute inset-0 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]"
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 350, damping: 28 }
              }
            />
          )}
          <span className="relative z-10 flex w-full items-center gap-3">
            <Settings
              className={cn(
                'h-[18px] w-[18px] transition-colors',
                location.pathname === '/settings' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
              )}
            />
            <span>Settings</span>
          </span>
        </Link>

        {/* Live Telemetry & Candidate Status Card */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#0F141C]/90 p-3.5 shadow-lg shadow-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75',
                    !shouldReduceMotion && 'animate-ping'
                  )}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                Telemetry Active
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan-300">
              <ShieldCheck className="h-3 w-3 text-cyan-400" />
              Proof Engine
            </span>
          </div>

          <div className="mt-3 min-w-0">
            <p className="truncate text-xs font-semibold text-slate-200">
              {user?.full_name || 'CareerPilot Student'}
            </p>
            <p className="truncate font-mono text-[11px] text-slate-400">
              {user?.email || 'student@careerpilot.io'}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
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
