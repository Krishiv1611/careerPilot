import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/auth-context';
import { AuthInput, AuthShell, SubmitButton } from './Login';


const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await signup(email, password, fullName);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return <AuthShell eyebrow="Create your workspace" title="Start with evidence, not guesswork." helper={<>Already have an account? <Link to="/login" className="font-bold text-[#36454f] hover:underline">Sign in</Link></>}><form onSubmit={handleSubmit} className="space-y-4"><AuthInput label="Full name" type="text" value={fullName} onChange={setFullName} placeholder="Your name" /><AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" /><div><AuthInput label="Password" type="password" value={password} onChange={setPassword} /><p className="mt-1.5 text-xs text-slate-500">Use at least 10 characters.</p></div>{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<SubmitButton loading={loading} label="Create account" /></form></AuthShell>;
};

export default Signup;
