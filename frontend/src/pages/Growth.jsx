import { useEffect, useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, Loader2, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

import { completeGrowthPriority, getGrowthPlan } from '../services/api';


const Growth = () => {
  const [plan, setPlan] = useState({ priorities: [], evidence_source_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionDrafts, setCompletionDrafts] = useState({});
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadGrowthPlan = async () => {
      try {
        const data = await getGrowthPlan();
        if (active) setPlan(data);
      } catch {
        if (active) setError('Your evidence-based growth plan could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGrowthPlan();
    return () => {
      active = false;
    };
  }, []);

  const updateCompletionDraft = (priorityId, field, value) => {
    setCompletionDrafts((current) => ({
      ...current,
      [priorityId]: { evidenceUrl: '', externalConfirmation: false, ...current[priorityId], [field]: value },
    }));
  };

  const finishPriority = async (priority) => {
    const draft = completionDrafts[priority.id] || { evidenceUrl: '', externalConfirmation: false };
    setCompletingId(priority.id);
    setError('');
    try {
      const completed = await completeGrowthPriority(priority.id, {
        evidence_url: draft.evidenceUrl.trim() || null,
        external_confirmation: draft.externalConfirmation,
      });
      setPlan((current) => ({
        ...current,
        priorities: current.priorities.map((item) => item.id === completed.id ? completed : item),
      }));
    } catch (completionError) {
      setError(completionError.response?.data?.detail || 'This priority could not be completed.');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#708090]" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Evidence-led development</p>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Growth</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">Build proof for recurring requirements from roles you genuinely reviewed—not a generic course checklist.</p>
      </header>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

      {plan.priorities.length > 0 ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Sprout className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Your three strongest evidence opportunities</h2>
                <p className="mt-1 text-sm text-slate-500">Calculated from {plan.evidence_source_count} saved resume {plan.evidence_source_count === 1 ? 'analysis' : 'analyses'}.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            {plan.priorities.map((priority, index) => (
              <article key={priority.skill} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="grid gap-5 md:grid-cols-[8rem_1fr]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#36454f]">Priority {index + 1}</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">{priority.skill}</h2>
                    <p className="mt-1 text-xs text-slate-500">Seen in {priority.job_count} {priority.job_count === 1 ? 'gap' : 'gaps'}</p>
                  </div>
                  <div className="space-y-4 border-t border-slate-200 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">One next action</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{priority.next_action}</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-[#fafaf7] p-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-xs leading-5 text-slate-600">{priority.completion_rule}</p>
                    </div>
                    {priority.status === 'completed' ? (
                      <div className="rounded-xl border border-slate-200 bg-[#f4f5f5] p-3">
                        <p className="text-xs font-bold text-[#36454f]">Completed with {priority.completion_source === 'evidence_link' ? 'linked evidence' : 'your external confirmation'}</p>
                        {priority.evidence_url && <a href={priority.evidence_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-slate-600 underline">{priority.evidence_url}</a>}
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                        <label className="block text-[11px] font-bold text-slate-600">
                          Evidence link (GitHub, deployed project, certificate, or portfolio)
                          <input value={completionDrafts[priority.id]?.evidenceUrl || ''} onChange={(event) => updateCompletionDraft(priority.id, 'evidenceUrl', event.target.value)} placeholder="https://" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-[#36454f]" />
                        </label>
                        <label className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                          <input type="checkbox" checked={completionDrafts[priority.id]?.externalConfirmation || false} onChange={(event) => updateCompletionDraft(priority.id, 'externalConfirmation', event.target.checked)} className="mt-0.5" />
                          I completed this outside CareerPilot and can explain the evidence in an interview.
                        </label>
                        <button type="button" onClick={() => finishPriority(priority)} disabled={completingId === priority.id} className="rounded-lg bg-[#36454f] px-3 py-2 text-xs font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300">
                          {completingId === priority.id ? 'Saving evidence…' : 'Mark complete with evidence'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef0f1] text-[#36454f]"><BookOpenCheck className="h-6 w-6" /></span>
          <h2 className="mt-4 text-xl font-bold text-slate-950">Your growth plan needs job evidence</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Create Resume Studio versions for roles you would genuinely apply to. Recurring JD gaps will become focused proof-building actions here.</p>
          <Link to="/profile/tailor" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30]">Open Resume Studio <ArrowRight className="h-4 w-4" /></Link>
        </section>
      )}
    </div>
  );
};

export default Growth;
