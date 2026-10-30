import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div;
const MotionButton = motion.button;

/**
 * StudioCard: Motion-wrapped obsidian card with subtle y-lift and hover border illumination.
 */
export function StudioCard({
  children,
  className = '',
  variant = 'default',
  glow = null,
  interactive = false,
  hoverLift = true,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  const variantClasses = {
    default: 'bg-[#0F141C] border border-[#1F2937] text-slate-100',
    elevated: 'bg-[#171F2C] border border-[#283548] text-slate-100',
    glass: 'studio-glass text-slate-100',
    interactive: 'bg-[#0F141C] border border-[#1F2937] hover:border-slate-600 text-slate-100',
  };

  const glowClasses = {
    emerald: 'hover:border-emerald-500/50 hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]',
    cyan: 'hover:border-cyan-500/50 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]',
    amber: 'hover:border-amber-500/50 hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]',
    crimson: 'hover:border-rose-500/50 hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.25)]',
  };

  const isClickable = interactive || Boolean(props.onClick);
  const canAnimateHover = (hoverLift || isClickable) && !shouldReduceMotion;

  return (
    <MotionDiv
      whileHover={canAnimateHover ? { y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } } : undefined}
      className={cn(
        'rounded-2xl transition-colors duration-200',
        variantClasses[variant] || variantClasses.default,
        !glow && 'hover:border-slate-700/80',
        glow && glowClasses[glow],
        isClickable && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}

/**
 * StudioBadge: Status badge with pulsing live telemetry indicator dot.
 */
export function StudioBadge({
  children,
  variant = 'cyan',
  dot = true,
  pulse = true,
  size = 'sm',
  className = '',
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const shouldPulse = pulse && !shouldReduceMotion;

  const variantStyles = {
    cyan: {
      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      dot: 'bg-cyan-400',
      ping: 'bg-cyan-400',
    },
    emerald: {
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
      ping: 'bg-emerald-400',
    },
    amber: {
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
      ping: 'bg-amber-400',
    },
    crimson: {
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
      ping: 'bg-rose-400',
    },
    neutral: {
      badge: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
      dot: 'bg-slate-400',
      ping: 'bg-slate-400',
    },
    default: {
      badge: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
      dot: 'bg-slate-400',
      ping: 'bg-slate-400',
    },
  };

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
  };

  const style = variantStyles[variant] || variantStyles.cyan;
  const sizeStyle = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border select-none',
        style.badge,
        sizeStyle,
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          {shouldPulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                style.ping
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', style.dot)} />
        </span>
      )}
      {children}
    </span>
  );
}

/**
 * StudioButton: Interactive button with spring tap feedback and studio variants.
 */
export function StudioButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const isInteractive = !disabled && !loading;

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-cyan-500/25 hover:brightness-105 active:brightness-95',
    secondary:
      'bg-[#171F2C] hover:bg-[#1F2937] text-slate-100 font-medium border border-[#283548] hover:border-slate-500/60 shadow-sm',
    glass:
      'bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-medium border border-white/10 hover:border-white/20 backdrop-blur-md shadow-sm',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white font-medium',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-medium border border-rose-500/30 hover:border-rose-500/50',
    emerald:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20',
  };

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 font-medium',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 font-medium',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 font-semibold',
    icon: 'p-2 rounded-xl',
  };

  const hoverProps = isInteractive && !shouldReduceMotion ? { scale: 1.01 } : undefined;
  const tapProps = isInteractive && !shouldReduceMotion ? { scale: 0.98 } : undefined;

  return (
    <MotionButton
      type={type}
      disabled={disabled || loading}
      whileHover={hoverProps}
      whileTap={tapProps}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center transition-colors duration-150 outline-none select-none cursor-pointer',
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
          {children}
          {IconRight && <IconRight className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </MotionButton>
  );
}

/**
 * StudioPillTab: Tab element with animated shared layoutId indicator.
 */
export function StudioPillTab({
  active = false,
  onClick,
  children,
  layoutId = 'active-tab-indicator',
  className = '',
  indicatorClassName = '',
  badge = null,
  icon: Icon = null,
  disabled = false,
  accent = 'cyan',
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  const accentStyles = {
    cyan: 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/40 shadow-cyan-500/10',
    emerald: 'bg-emerald-500/20 border-emerald-500/40 shadow-emerald-500/10',
    amber: 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/10',
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors duration-200 outline-none select-none flex items-center gap-2 cursor-pointer',
        active ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {active && (
        <MotionDiv
          layoutId={layoutId}
          className={cn(
            'absolute inset-0 rounded-xl border shadow-sm',
            accentStyles[accent] || accentStyles.cyan,
            indicatorClassName
          )}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 380, damping: 28 }
          }
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        <span>{children}</span>
        {badge !== null && badge !== undefined && (
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/10 text-slate-200">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * StudioPillTabs: Group container for pill tabs.
 */
export function StudioPillTabs({
  tabs = [],
  activeTab,
  onChange,
  layoutId = 'active-tab-indicator',
  className = '',
  pillClassName = '',
  accent = 'cyan',
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-2xl bg-[#0F141C] border border-[#1F2937]',
        className
      )}
    >
      {tabs.map((tab) => (
        <StudioPillTab
          key={tab.id}
          active={activeTab === tab.id}
          onClick={() => onChange?.(tab.id)}
          layoutId={layoutId}
          icon={tab.icon}
          badge={tab.badge}
          disabled={tab.disabled}
          accent={accent}
          className={pillClassName}
        >
          {tab.label}
        </StudioPillTab>
      ))}
    </div>
  );
}

/**
 * StudioMotionDrawer: Slide-over drawer with spring physics, overlay backdrop, and accessibility.
 */
export function StudioMotionDrawer({
  isOpen = false,
  onClose,
  title = null,
  description = null,
  children,
  side = 'right',
  size = 'md',
  className = '',
  showClose = true,
}) {
  const shouldReduceMotion = useReducedMotion();

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const sizeClasses = {
    sm: 'w-full sm:max-w-sm',
    md: 'w-full sm:max-w-md',
    lg: 'w-full sm:max-w-xl',
    xl: 'w-full sm:max-w-3xl',
    full: 'w-full',
  };

  const positionClasses = {
    right: 'inset-y-0 right-0 border-l border-[#1F2937]',
    left: 'inset-y-0 left-0 border-r border-[#1F2937]',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] border-t border-[#1F2937] rounded-t-2xl',
  };

  const variants = {
    right: {
      initial: shouldReduceMotion ? { opacity: 0 } : { x: '100%' },
      animate: shouldReduceMotion ? { opacity: 1 } : { x: 0 },
      exit: shouldReduceMotion ? { opacity: 0 } : { x: '100%' },
    },
    left: {
      initial: shouldReduceMotion ? { opacity: 0 } : { x: '-100%' },
      animate: shouldReduceMotion ? { opacity: 1 } : { x: 0 },
      exit: shouldReduceMotion ? { opacity: 0 } : { x: '-100%' },
    },
    bottom: {
      initial: shouldReduceMotion ? { opacity: 0 } : { y: '100%' },
      animate: shouldReduceMotion ? { opacity: 1 } : { y: 0 },
      exit: shouldReduceMotion ? { opacity: 0 } : { y: '100%' },
    },
  };

  const currentVariant = variants[side] || variants.right;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <MotionDiv
            role="dialog"
            aria-modal="true"
            initial={currentVariant.initial}
            animate={currentVariant.animate}
            exit={currentVariant.exit}
            transition={
              shouldReduceMotion
                ? { duration: 0.15 }
                : { type: 'spring', damping: 30, stiffness: 350 }
            }
            className={cn(
              'fixed bg-[#0F141C] text-slate-100 shadow-2xl flex flex-col',
              positionClasses[side] || positionClasses.right,
              sizeClasses[size] || sizeClasses.md,
              className
            )}
          >
            {(title || description || showClose) && (
              <div className="flex items-center justify-between border-b border-[#1F2937] px-6 py-4">
                <div>
                  {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
                  {description && (
                    <p className="text-sm text-slate-400 mt-0.5">{description}</p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl p-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
}
