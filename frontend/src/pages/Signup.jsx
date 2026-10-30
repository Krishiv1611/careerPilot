import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/auth-context';
import { AuthInput, AuthShell, SubmitButton } from './Login';

const MotionDiv = motion.div;

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await signup(email, password, fullName);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <AuthShell
      eyebrow="Workspace Setup"
      title="Start with evidence, not guesswork."
      description="Connect your technical milestones, eliminate unbacked claims, and tailor applications to real recruiter gaze patterns."
      helper={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          >
            Sign in
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
            label="Full name"
            type="text"
            value={fullName}
            onChange={setFullName}
            placeholder="Your name"
            autoComplete="name"
            required
          />

          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <div className="space-y-1.5">
            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Create a secure password"
              autoComplete="new-password"
              required
            />
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="h-3 w-3 text-cyan-400/80" />
              <span>Use at least 10 characters.</span>
            </p>
          </div>

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

          <SubmitButton loading={loading} label="Create account" />
        </MotionDiv>
      </form>
    </AuthShell>
  );
};

export default Signup;
