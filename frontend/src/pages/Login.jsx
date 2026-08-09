import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/auth-context';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return <AuthShell eyebrow="Welcome back" title="Continue your next application." helper={<>New to CareerPilot? <Link to="/signup" className="font-bold text-[#36454f] hover:underline">Create an account</Link></>}><form onSubmit={handleSubmit} className="space-y-4"><AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" /><AuthInput label="Password" type="password" value={password} onChange={setPassword} />{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<SubmitButton loading={loading} label="Sign in" /></form></AuthShell>;
};


const AuthShell = ({ eyebrow, title, helper, children }) => <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]"><section><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">{eyebrow}</p><h1 className="mt-3 max-w-lg text-4xl font-black tracking-[-0.045em] text-[#36454f] sm:text-5xl">{title}</h1><p className="mt-4 max-w-md text-sm leading-6 text-slate-500">Focused job pages, explainable matching, truthful resume versions, and application follow-through in one workspace.</p></section><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,42,67,0.09)] sm:p-8">{children}<p className="mt-6 text-center text-sm text-slate-500">{helper}</p></section></main>;
const AuthInput = ({ label, type, value, onChange, placeholder }) => <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#708090] focus:ring-2 focus:ring-[#d3d3d3]" /></label>;
const SubmitButton = ({ loading, label }) => <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#36454f] text-sm font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Please wait…' : label}</button>;

export { AuthInput, AuthShell, SubmitButton };
export default Login;
