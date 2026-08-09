import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, FileCheck2, FileUser, ListChecks, Loader2, RefreshCw, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/auth-context';
import { getToday } from '../services/api';


const actionIcons = {
  add_resume: FileUser,
  find_jobs: BriefcaseBusiness,
  review_job: BriefcaseBusiness,
  resume_review: FileCheck2,
  follow_up_due: ListChecks,
  deadline_due: ListChecks,
  application_action: ListChecks,
  growth_review: Sprout,
};


const Home = () => {
  const { user } = useAuth();
  const [today, setToday] = useState({ action: null, counts: { resumes: 0, jobs: 0, applications: 0, resume_drafts: 0 } });
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadToday = async () => {
      setLoading(true);
      setWarning('');

      try {
        const result = await getToday();
        if (active) setToday(result);
      } catch {
        if (active) setWarning('Your next action could not be loaded. Try refreshing the workspace.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadToday();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#708090]" /></div>;
  }

  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const nextAction = today.action;
  const NextIcon = actionIcons[nextAction?.kind] || ListChecks;
  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">{todayLabel}</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            {firstName ? `${firstName}, here’s your next move.` : 'Here’s your next move.'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A focused workspace for evidence, relevant jobs, and application follow-through.</p>
        </div>
        <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </header>

      {warning && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{warning}</div>}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Workspace totals">
        <Metric label="Resumes" value={today.counts.resumes} helper={`${today.counts.resume_drafts} waiting drafts`} />
        <Metric label="Jobs available" value={today.counts.jobs} helper="Your workspace only" />
        <Metric label="Applications" value={today.counts.applications} helper="Explicit records" />
      </section>

      {nextAction ? <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">{nextAction.eyebrow}</p>
            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.04em] text-slate-950">{nextAction.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{nextAction.description}</p>
            <Link to={nextAction.path} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30]">
              {nextAction.action} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid min-h-56 place-items-center border-t border-slate-200 bg-[#eef0f1] p-8 lg:border-l lg:border-t-0">
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <NextIcon className="h-11 w-11 text-[#36454f]" strokeWidth={1.7} />
            </div>
          </div>
        </div>
      </section> : <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="text-sm text-slate-600">Refresh to load your evidence-based next action.</p></section>}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Trust rule</p>
          <h2 className="mt-3 text-lg font-bold text-slate-950">Analysis is not an application</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">CareerPilot creates an application only after you confirm it. Generated suggestions remain drafts until you approve them.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Evidence rule</p>
          <h2 className="mt-3 text-lg font-bold text-slate-950">No invented resume claims</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Future resume changes will point back to your resume, GitHub, or an answer you personally confirmed.</p>
        </article>
      </section>
    </div>
  );
};


const Metric = ({ label, value, helper }) => (
  <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <p className="text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="pb-1 text-xs text-slate-500">{helper}</p>
    </div>
  </article>
);

export default Home;
