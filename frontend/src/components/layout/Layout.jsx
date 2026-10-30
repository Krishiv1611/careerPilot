import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { useAuth } from '../../context/auth-context';
import { cn } from '../../lib/utils';
import AppSidebar from './AppSidebar';
import MobileNavigation from './MobileNavigation';
import Navbar from './Navbar';

const MotionMain = motion.main;

const publicPaths = new Set(['/', '/login', '/signup']);

const routeTitles = {
  '/dashboard': 'Today',
  '/jobs': 'Find Jobs',
  '/profile': 'Resume & Profile',
  '/profile/tailor': 'Resume Studio',
  '/applications': 'Applications',
  '/growth': 'Growth Workbench',
  '/settings': 'Settings',
};

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const isPublic = !user || publicPaths.has(location.pathname);

  const currentTitle =
    routeTitles[location.pathname] ||
    (location.pathname.startsWith('/profile') ? 'Resume & Profile' : 'Studio Workspace');

  if (isPublic) {
    return (
      <div className="min-h-screen bg-[#080B0F] font-sans text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <AnimatePresence mode="wait">
          <MotionMain
            key={location.pathname}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="min-h-[calc(100vh-4rem)] bg-[#080B0F] text-slate-100"
          >
            {children}
          </MotionMain>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="product-shell flex min-h-screen bg-[#080B0F] font-sans text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Studio Mobile Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-[#1E293B] bg-[#0B0F15]/95 px-5 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 text-xs font-black text-cyan-400">
              CP
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">CareerPilot</p>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  STUDIO OS
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75',
                    !shouldReduceMotion && 'animate-ping'
                  )}
                />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </div>
        </header>

        {/* Studio Desktop Top Bar & Breadcrumbs */}
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-[#1E293B] bg-[#080B0F]/80 px-8 backdrop-blur-md md:flex">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Studio</span>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-slate-200">{currentTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75',
                    !shouldReduceMotion && 'animate-ping'
                  )}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Studio Engine Active</span>
            </div>

            {user && (
              <div className="flex items-center gap-2 rounded-xl border border-[#1E293B] bg-[#0F141C] px-3 py-1.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="max-w-[160px] truncate font-medium">{user.full_name || user.email}</span>
              </div>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <MotionMain
            key={location.pathname}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-7 pb-28 text-slate-100 sm:px-8 md:px-10 md:py-10 md:pb-10"
          >
            {children}
          </MotionMain>
        </AnimatePresence>
      </div>
      <MobileNavigation />
    </div>
  );
};

export default Layout;
