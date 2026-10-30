import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Code2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/auth-context';
import { cn } from '../lib/utils';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <AuthShell
      eyebrow="Studio Access"
      title="Continue your next application."
      helper={
        <>
          New to CareerPilot?{' '}
          <Link
            to="/signup"
            className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <MotionDiv
          key={error ? 'error-active' : 'error-none'}
          animate={error && !shouldReduceMotion ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-4"
        >
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <AnimatePresence>
            {error && (
              <MotionDiv
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 shadow-sm"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span className="flex-1 font-medium leading-relaxed">{error}</span>
              </MotionDiv>
            )}
          </AnimatePresence>

          <SubmitButton loading={loading} label="Sign in" />
        </MotionDiv>
      </form>
    </AuthShell>
  );
};

const proofPoints = [
  {
    icon: Code2,
    title: 'Evidence-First Architecture',
    desc: 'Extract technical milestones directly from real repository commits',
  },
  {
    icon: Sparkles,
    title: '6-Second Recruiter X-Ray',
    desc: 'Optimize F-pattern dwell time and eliminate generic fluff phrases',
  },
  {
    icon: ShieldCheck,
    title: 'Ghost Listing Shield',
    desc: 'Audit employer activity signals to target active recruiting pipelines',
  },
];

const AuthShell = ({
  eyebrow = 'Welcome back',
  title = 'Continue your next application.',
  description,
  helper,
  children,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#080B0F] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      {/* Background Mesh Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/5 blur-[120px]" />

        {/* Subtle Cyber Obsidian Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 60%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 60%, transparent 100%)',
          }}
        />
      </div>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        {/* Left Column: Context, Branding, Proof Points */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-medium text-cyan-300 shadow-sm shadow-cyan-500/10">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'inline-flex h-full w-full rounded-full bg-cyan-400',
                  !shouldReduceMotion && 'absolute animate-ping opacity-75'
                )}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider">{eyebrow}</span>
          </div>

          <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl leading-[1.1]">
            {title}
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
            {description ||
              'Focused job pages, explainable matching, truthful resume versions, and application follow-through in one workspace.'}
          </p>

          <div className="pt-2 space-y-3 max-w-md">
            {proofPoints.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-[#0B0F15]/80 p-3.5 backdrop-blur-sm transition-colors hover:border-slate-700/80"
                >
                  <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200">{item.title}</p>
                    <p className="text-xs leading-normal text-slate-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Glassmorphism Card */}
        <section className="relative rounded-3xl border border-slate-800 bg-[#0F141C]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-cyan-950/20 overflow-hidden">
          {/* Top luminous accent glow */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative z-10">
            {children}
            <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-xs sm:text-sm text-slate-400">
              {helper}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const AuthInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  autoComplete,
  id,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;

  return (
    <label htmlFor={inputId} className="block space-y-1.5 text-left">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label}
      </span>
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={resolvedType}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={cn(
            'h-11 w-full rounded-xl border border-slate-800 bg-[#0B0F15] px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200',
            'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 hover:border-slate-700',
            isPassword && 'pr-10'
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
};

const SubmitButton = ({ loading = false, label }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionButton
      type="submit"
      disabled={loading}
      whileHover={!loading && !shouldReduceMotion ? { scale: 1.01 } : undefined}
      whileTap={!loading && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold select-none transition-all duration-200',
        'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-105 active:brightness-95',
        loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
          <span>Please wait...</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight className="h-4 w-4 text-slate-950" />
        </>
      )}
    </MotionButton>
  );
};

export { AuthInput, AuthShell, SubmitButton };
export default Login;
