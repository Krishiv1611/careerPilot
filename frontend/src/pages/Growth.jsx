import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Github,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  completeGrowthPriority,
  getGrowthPlan,
  getSkillBlueprint,
  verifyGitHubRepo,
} from '../services/api';


const BlueprintModal = ({ skill, onClose }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchBlueprint = async () => {
      try {
        const data = await getSkillBlueprint(skill);
        if (active) setBlueprint(data);
      } catch {
        if (active) setError(`No curated blueprint available for '${skill}' yet.`);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBlueprint();
    return () => {
      active = false;
    };
  }, [skill]);

  const copySnippet = () => {
    if (blueprint?.starter_snippet) {
      navigator.clipboard.writeText(blueprint.starter_snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#36454f] text-white">
              <Code2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Actionable Project Blueprint</h2>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#36454f]">{skill}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-[30vh] place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#708090]" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">{blueprint.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{blueprint.summary}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Required Repository Files</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {blueprint.required_files.map((file) => (
                  <span
                    key={file}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-medium text-slate-800"
                  >
                    <Check className="h-3 w-3 text-emerald-600" /> {file}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Implementation Steps</p>
              <ol className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                {blueprint.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {blueprint.starter_snippet && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter Code Snippet</p>
                  <button
                    type="button"
                    onClick={copySnippet}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#36454f] hover:underline"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy snippet'}
                  </button>
                </div>
                <pre className="mt-2 max-h-56 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100">
                  {blueprint.starter_snippet}
                </pre>
              </div>
            )}

            {blueprint.suggested_bullet && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Quantified STAR Resume Bullet</p>
                <p className="mt-1 text-xs leading-5 text-emerald-950">{blueprint.suggested_bullet}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


const Growth = () => {
  const [plan, setPlan] = useState({ priorities: [], evidence_source_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionDrafts, setCompletionDrafts] = useState({});
  const [completingId, setCompletingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [activeBlueprintSkill, setActiveBlueprintSkill] = useState(null);

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

  const handleVerifyRepo = async (priority) => {
    const draft = completionDrafts[priority.id] || { evidenceUrl: '' };
    const url = draft.evidenceUrl.trim();
    if (!url) {
      setError('Enter a public GitHub repository URL before verifying.');
      return;
    }

    setVerifyingId(priority.id);
    setError('');
    try {
      const result = await verifyGitHubRepo(url, priority.skill);
      setVerificationResults((current) => ({
        ...current,
        [priority.id]: result,
      }));
    } catch (verifyErr) {
      setError(verifyErr.response?.data?.detail || 'GitHub repo inspection failed.');
    } finally {
      setVerifyingId(null);
    }
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
        priorities: current.priorities.map((item) => (item.id === completed.id ? completed : item)),
      }));
    } catch (completionError) {
      setError(completionError.response?.data?.detail || 'This priority could not be completed.');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#708090]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {activeBlueprintSkill && (
        <BlueprintModal
          skill={activeBlueprintSkill}
          onClose={() => setActiveBlueprintSkill(null)}
        />
      )}

      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Evidence-led development</p>
        <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Growth</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Build proof for recurring requirements from roles you genuinely reviewed—with actionable blueprints and automated code inspection.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {plan.priorities.length > 0 ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Sprout className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Your three strongest evidence opportunities</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Calculated from {plan.evidence_source_count} saved resume{' '}
                  {plan.evidence_source_count === 1 ? 'analysis' : 'analyses'}.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            {plan.priorities.map((priority, index) => {
              const verifyResult = verificationResults[priority.id];
              return (
                <article key={priority.skill} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="grid gap-5 md:grid-cols-[10rem_1fr]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#36454f]">
                        Priority {index + 1}
                      </p>
                      <h2 className="mt-2 text-xl font-black text-slate-950">{priority.skill}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Seen in {priority.job_count} {priority.job_count === 1 ? 'gap' : 'gaps'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveBlueprintSkill(priority.skill)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-[#36454f] hover:bg-slate-100"
                      >
                        <Code2 className="h-3.5 w-3.5" /> View Blueprint
                      </button>
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
                          <p className="text-xs font-bold text-[#36454f]">
                            Completed with{' '}
                            {priority.completion_source === 'github_verified'
                              ? 'verified GitHub repository'
                              : priority.completion_source === 'evidence_link'
                              ? 'linked evidence'
                              : 'your external confirmation'}
                          </p>
                          {priority.evidence_url && (
                            <a
                              href={priority.evidence_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block truncate text-xs text-slate-600 underline"
                            >
                              {priority.evidence_url}
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                          <label className="block text-[11px] font-bold text-slate-600">
                            Evidence link (GitHub repository or live demo)
                            <div className="mt-1.5 flex gap-2">
                              <input
                                value={completionDrafts[priority.id]?.evidenceUrl || ''}
                                onChange={(event) =>
                                  updateCompletionDraft(priority.id, 'evidenceUrl', event.target.value)
                                }
                                placeholder="https://github.com/username/repo"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:border-[#36454f]"
                              />
                              <button
                                type="button"
                                onClick={() => handleVerifyRepo(priority)}
                                disabled={verifyingId === priority.id}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#36454f] bg-white px-3 py-2 text-xs font-bold text-[#36454f] hover:bg-slate-50 disabled:bg-slate-100"
                              >
                                {verifyingId === priority.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Github className="h-3.5 w-3.5" />
                                )}
                                Inspect Repo
                              </button>
                            </div>
                          </label>

                          {/* Live inspection result badge */}
                          {verifyResult && (
                            <div
                              className={`rounded-xl border p-3 text-xs ${
                                verifyResult.verified
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                  : 'border-rose-200 bg-rose-50 text-rose-950'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold">
                                {verifyResult.verified ? (
                                  <>
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Authentic Repository Verified!
                                  </>
                                ) : (
                                  <>
                                    <ShieldAlert className="h-4 w-4 text-rose-600" /> Verification Incomplete
                                  </>
                                )}
                              </div>
                              <ul className="mt-2 space-y-1 text-[11px]">
                                {verifyResult.reasons.map((r, i) => (
                                  <li key={i}>• {r}</li>
                                ))}
                              </ul>
                              {verifyResult.generated_bullet && (
                                <div className="mt-2.5 rounded-lg border border-emerald-300 bg-white p-2.5 text-xs text-slate-800">
                                  <span className="font-bold text-emerald-800">STAR Resume Bullet Ready:</span>{' '}
                                  {verifyResult.generated_bullet}
                                </div>
                              )}
                            </div>
                          )}

                          <label className="flex items-start gap-2 text-[11px] leading-5 text-slate-600">
                            <input
                              type="checkbox"
                              checked={completionDrafts[priority.id]?.externalConfirmation || false}
                              onChange={(event) =>
                                updateCompletionDraft(priority.id, 'externalConfirmation', event.target.checked)
                              }
                              className="mt-0.5"
                            />
                            I completed this outside CareerPilot and can explain the evidence in an interview.
                          </label>

                          <button
                            type="button"
                            onClick={() => finishPriority(priority)}
                            disabled={completingId === priority.id}
                            className="rounded-lg bg-[#36454f] px-3 py-2 text-xs font-bold text-white hover:bg-[#202a30] disabled:bg-slate-300"
                          >
                            {completingId === priority.id ? 'Saving evidence…' : 'Mark complete with evidence'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef0f1] text-[#36454f]">
            <BookOpenCheck className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-950">Your growth plan needs job evidence</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Create Resume Studio versions for roles you would genuinely apply to. Recurring JD gaps will become focused proof-building actions here.
          </p>
          <Link
            to="/profile/tailor"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30]"
          >
            Open Resume Studio <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}
    </div>
  );
};

export default Growth;
