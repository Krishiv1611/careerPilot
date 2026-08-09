import { LogOut, ShieldCheck } from 'lucide-react';

import { useAuth } from '../context/auth-context';


const Settings = () => {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Account</p>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950">Settings</h1>
        <p className="text-sm text-slate-600">Manage your CareerPilot account and connected data.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-950">Profile</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Name</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{user?.full_name || 'Not provided'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Email</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{user?.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <h2 className="font-bold text-slate-950">Provider credentials are server managed</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">CareerPilot no longer asks students to paste AI or job-search API keys into the browser.</p>
          </div>
        </div>
      </section>

      <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
};

export default Settings;
