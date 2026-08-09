import { useEffect, useState } from 'react';
import { Check, FileText, Loader2, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

import { mergeTargetRole } from '../app/career-track-suggestions';
import {
  deleteResume,
  getAllResumes,
  getCandidateProfile,
  updateCandidateProfile,
  uploadResume,
} from '../services/api';


const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [profile, setProfile] = useState({ target_roles: [], preferred_locations: [], employment_types: [], skills: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTrack, setSavingTrack] = useState('');
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const refreshResumes = async () => {
    const data = await getAllResumes();
    setResumes(data);
    return data;
  };

  const refreshProfile = async () => {
    const data = await getCandidateProfile();
    setProfile(data);
    return data;
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const [resumeData, profileData] = await Promise.all([getAllResumes(), getCandidateProfile()]);
        if (active) {
          setResumes(resumeData);
          setProfile(profileData);
        }
      } catch {
        if (active) setError('Your profile could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadResume(file);
      setSelectedResume(uploaded);
      setFile(null);
      await Promise.all([refreshResumes(), refreshProfile()]);
    } catch (uploadError) {
      setError(uploadError.response?.data?.detail || 'The resume could not be uploaded. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    setError('');
    try {
      await deleteResume(resumeId);
      const [remaining] = await Promise.all([refreshResumes(), refreshProfile()]);
      if (selectedResume?.id === resumeId) setSelectedResume(remaining[0] || null);
      setPendingDeleteId(null);
    } catch {
      setError('The resume could not be deleted.');
    }
  };

  const saveProfile = async (preferences) => {
    setSavingProfile(true);
    setError('');
    try {
      const updated = await updateCandidateProfile(preferences);
      setProfile(updated);
      return updated;
    } catch {
      setError('Your job preferences could not be saved.');
      return null;
    } finally {
      setSavingProfile(false);
    }
  };

  const useCareerTrack = async (category) => {
    setSavingTrack(category);
    await saveProfile(mergeTargetRole(profile, category));
    setSavingTrack('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">Your source of truth</p>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Resume &amp; Profile</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">Keep job preferences separate from evidence. CareerPilot only treats resume or approved GitHub content as proof.</p>
        </div>
        <Link to="/profile/tailor" className="inline-flex items-center justify-center rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30]">Open Resume Studio</Link>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <ProfilePreferences key={`${profile.id || 'new'}:${(profile.target_roles || []).join('|')}`} profile={profile} saving={savingProfile} onSave={saveProfile} />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef0f1] text-[#36454f]"><Upload className="h-5 w-5" /></span>
              <div><h2 className="font-bold text-slate-950">Add your current resume</h2><p className="mt-1 text-sm text-slate-500">PDF and DOCX are supported. DOCX allows same-template export.</p></div>
            </div>

            <label htmlFor="resume-file" className="mt-6 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-[#fafaf7] p-5 text-center hover:border-[#708090] hover:bg-[#eef0f1]/40">
              <FileText className="mx-auto h-7 w-7 text-slate-400" />
              <span className="mt-2 block text-sm font-bold text-slate-800">{file?.name || 'Choose a PDF or DOCX resume'}</span>
              <span className="mt-1 block text-xs text-slate-500">Maximum 10 MB</span>
            </label>
            <input id="resume-file" type="file" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />

            <button type="button" onClick={handleUpload} disabled={!file || uploading} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#36454f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#202a30] disabled:cursor-not-allowed disabled:bg-slate-300">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Extracting evidence…' : 'Add resume'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" /><div><h2 className="font-bold text-slate-950">Your original stays unchanged</h2><p className="mt-1 text-sm leading-6 text-slate-500">Tailored versions are separate and require your approval before download or application use.</p></div></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5"><h2 className="font-bold text-slate-950">Saved evidence sources</h2><p className="mt-1 text-sm text-slate-500">Choose a resume to inspect what CareerPilot extracted.</p></div>

          {loading ? (
            <div className="grid min-h-72 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#708090]" /></div>
          ) : resumes.length === 0 ? (
            <div className="px-6 py-14 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">No resume added yet</h3><p className="mt-1 text-sm text-slate-500">Your extracted skills and evidence will appear here.</p></div>
          ) : (
            <div className="grid min-h-[26rem] md:grid-cols-[14rem_1fr]">
              <div className="border-b border-slate-200 p-3 md:border-b-0 md:border-r">
                <div className="space-y-2">
                  {resumes.map((resume, index) => {
                    const active = (selectedResume?.id || resumes[0]?.id) === resume.id;
                    return <button key={resume.id} type="button" onClick={() => setSelectedResume(resume)} className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${active ? 'border-[#d3d3d3] bg-[#eef0f1]' : 'border-transparent hover:bg-slate-50'}`}><span className="block text-sm font-bold text-slate-900">Resume {index + 1}</span><span className="mt-1 block text-xs text-slate-500">{new Date(resume.created_at).toLocaleDateString('en-IN')}</span></button>;
                  })}
                </div>
              </div>

              <ResumeEvidence resume={selectedResume || resumes[0]} profile={profile} savingTrack={savingTrack} onUseTrack={useCareerTrack} pendingDeleteId={pendingDeleteId} onRequestDelete={setPendingDeleteId} onDelete={handleDelete} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};


const ProfilePreferences = ({ profile, saving, onSave }) => {
  const [roles, setRoles] = useState((profile.target_roles || []).join(', '));
  const [locations, setLocations] = useState((profile.preferred_locations || []).join(', '));
  const [employmentTypes, setEmploymentTypes] = useState(profile.employment_types || []);

  const toggleType = (type) => setEmploymentTypes((current) => current.includes(type) ? current.filter((value) => value !== type) : [...current, type]);
  const save = () => onSave({ target_roles: splitValues(roles), preferred_locations: splitValues(locations), employment_types: employmentTypes });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Job preferences</p><h2 className="mt-2 text-lg font-bold text-slate-950">Tell discovery what relevant means</h2><p className="mt-1 text-sm text-slate-500">Preferences guide searches. They are not treated as resume evidence.</p></div>
        <p className="text-xs font-bold text-[#36454f]">{profile.skills?.length || 0} detected resume skills</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">Target roles</span><input value={roles} onChange={(event) => setRoles(event.target.value)} placeholder="Backend Developer, Data Analyst" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
        <label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">Preferred locations</span><input value={locations} onChange={(event) => setLocations(event.target.value)} placeholder="Bengaluru, Remote, India" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{['full-time', 'internship', 'contract'].map((type) => <button key={type} type="button" onClick={() => toggleType(type)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${employmentTypes.includes(type) ? 'border-[#b9c1c6] bg-[#eef0f1] text-[#36454f]' : 'border-slate-200 text-slate-500'}`}>{type}</button>)}</div>
      <button type="button" onClick={save} disabled={saving} className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">{saving ? 'Saving…' : 'Save preferences'}</button>
    </section>
  );
};


const ResumeEvidence = ({ resume, profile, savingTrack, onUseTrack, pendingDeleteId, onRequestDelete, onDelete }) => (
  <div className="p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Current extraction</p><h3 className="mt-2 text-lg font-bold text-slate-950">Resume evidence</h3></div>
      {pendingDeleteId === resume.id ? (
        <div className="text-right"><p className="mb-2 max-w-48 text-[11px] leading-4 text-red-700">Also removes tailored versions and saved analysis.</p><div className="flex justify-end gap-2"><button type="button" onClick={() => onRequestDelete(null)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button><button type="button" onClick={() => onDelete(resume.id)} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-700">Delete resume</button></div></div>
      ) : <button type="button" onClick={() => onRequestDelete(resume.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label="Delete resume"><Trash2 className="h-4 w-4" /></button>}
    </div>

    <CareerTrackRail resume={resume} profile={profile} savingTrack={savingTrack} onUseTrack={onUseTrack} />

    <SkillGroups resume={resume} />

    <details className="mt-7 rounded-xl border border-slate-200 bg-[#fafaf7]"><summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700">Review extracted text</summary><div className="max-h-64 overflow-auto whitespace-pre-wrap border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-600">{resume.raw_text}</div></details>
  </div>
);


const CareerTrackRail = ({ resume, profile, savingTrack, onUseTrack }) => {
  const suggestions = resume.career_track_suggestions || [];
  const targetRoles = (profile.target_roles || []).map((role) => role.toLowerCase());

  return (
    <section className="mt-6 border-y border-slate-200 py-5">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#36454f]">Career tracks suggested from this resume</p>
      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">A starting point, not a decision. Add only the roles you actually want to pursue.</p>

      {suggestions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No reliable track suggestion is available for this resume. You can still enter your own target roles above.</p>
      ) : (
        <ol className="mt-5 space-y-4 border-l-2 border-[#d3d3d3] pl-5">
          {suggestions.map((suggestion) => {
            const alreadyTargeted = targetRoles.includes(suggestion.category.toLowerCase());
            const isSaving = savingTrack === suggestion.category;

            return (
              <li key={`${suggestion.category}-${suggestion.rank}`} className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <span className="absolute -left-[2.15rem] grid h-7 w-7 place-items-center rounded-full border-4 border-white bg-[#d3d3d3] text-[11px] font-black text-[#36454f]">{suggestion.rank}</span>
                <div>
                  <p className="text-sm font-bold text-slate-950">{suggestion.category}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{Math.round(suggestion.confidence * 100)}% model signal</p>
                </div>
                {alreadyTargeted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> In target roles</span>
                ) : (
                  <button type="button" onClick={() => onUseTrack(suggestion.category)} disabled={Boolean(savingTrack)} className="self-start rounded-lg border border-[#d3d3d3] bg-[#eef0f1] px-3 py-2 text-xs font-bold text-[#36454f] hover:border-[#b9c1c6] hover:bg-[#d3d3d3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#708090] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:self-auto">
                    {isSaving ? 'Adding role…' : 'Use as target role'}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};


const SkillGroups = ({ resume }) => {
  const groups = Object.entries(resume.skill_categories || {}).filter(([, skills]) => skills.length > 0);

  return (
    <div className="mt-6">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Skills found</p>
      {groups.length > 0 ? (
        <div className="mt-3 space-y-4">{groups.map(([category, skills]) => <div key={category}><p className="text-xs font-bold text-slate-600">{humanizeCategory(category)}</p><div className="mt-2 flex flex-wrap gap-2">{skills.map((skill) => <SkillTag key={skill} skill={skill} />)}</div></div>)}</div>
      ) : (resume.extracted_skills || []).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">{resume.extracted_skills.map((skill) => <SkillTag key={skill} skill={skill} />)}</div>
      ) : <p className="mt-3 text-sm text-slate-500">No structured skills were extracted. The source text is still available for review.</p>}
    </div>
  );
};


const SkillTag = ({ skill }) => <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"><Check className="h-3 w-3" /> {skill}</span>;
const splitValues = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const humanizeCategory = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default UploadResume;
