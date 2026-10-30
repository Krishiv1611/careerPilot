import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';

const MotionDiv = motion.div;

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0B0F15]/90 text-slate-100 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Studio Brand */}
        <Link to="/" className="flex items-center gap-3 focus:outline-none" aria-label="CareerPilot home">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 text-xs font-black text-cyan-400 shadow-sm shadow-cyan-500/10">
            CP
          </div>
          <div>
            <span className="block font-black tracking-tight text-white">CareerPilot</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-400/90">
                Student Application OS
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="mr-2 hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-medium text-emerald-400 md:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={
                  shouldReduceMotion
                    ? 'inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400'
                    : 'absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping'
                }
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Studio Engine Online
          </div>

          <Link
            to="/login"
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Log in
          </Link>

          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:brightness-105 active:scale-[0.98]"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="cursor-pointer rounded-xl border border-[#1E293B] bg-white/[0.04] p-2 text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white sm:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Animated Dropdown Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MotionDiv
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-b border-[#1E293B] bg-[#0B0F15]/98 px-5 py-4 backdrop-blur-xl sm:hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[#1E293B] bg-[#0F141C] p-3">
                <span className="text-xs font-semibold text-slate-300">Studio Engine Status</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live & Ready
                </span>
              </div>

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
              >
                <span>Log in</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:brightness-105 active:scale-[0.98]"
              >
                <span>Get started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
