import { ArrowRight, Check, FileSearch, FileText, Github, Search } from 'lucide-react';
import { Link } from 'react-router-dom';


const LandingPage = () => (
  <div className="bg-[#f4f5f5] text-slate-950">
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <p className="inline-flex rounded-full border border-[#d3d3d3] bg-[#eef0f1] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#36454f]">For students and recent graduates in India</p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#202a30] sm:text-6xl lg:text-7xl">Make every application easier to trust.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">CareerPilot finds real fresher roles, explains what your resume proves, and helps you tailor it without inventing experience.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#36454f] px-5 py-3 text-sm font-bold text-white hover:bg-[#202a30]">Build my application workspace <ArrowRight className="h-4 w-4" /></Link>
            <a href="#how-it-works" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">See the workflow</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500"><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> No provider keys in your browser</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> No fake resume claims</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> No generic job articles</span></div>
        </div>

        <ProductPreview />
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#36454f]">One connected workflow</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#202a30] sm:text-4xl">From “What should I apply to?” to a resume you can defend.</h2></div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-4">
            <WorkflowStep number="01" icon={<Search className="h-5 w-5 text-[#36454f]" />} title="Find focused roles" description="SerpAPI and Tavily search together; the filter keeps likely fresher job pages and shows their provider status." />
            <WorkflowStep number="02" icon={<FileSearch className="h-5 w-5 text-[#36454f]" />} title="Check the evidence" description="See eligibility blockers, matched requirements, and the resume line behind each claim." />
            <WorkflowStep number="03" icon={<FileText className="h-5 w-5 text-[#36454f]" />} title="Tailor safely" description="Compare a JD, approve changes, keep versions, and preserve a DOCX template when available." />
            <WorkflowStep number="04" icon={<Github className="h-5 w-5 text-[#36454f]" />} title="Recover hidden proof" description="Let the official GitHub MCP inspect only approved repositories for relevant existing projects." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <Principle label="Truth over scores" title="A percentage never stands alone." description="CareerPilot shows detected requirements, blockers, evidence, uncertainty, and the original job source." />
          <Principle label="Action over dashboards" title="Every screen answers what to do next." description="Today, Applications, and Growth are driven by your persisted activity—not sample charts or fake streaks." />
          <Principle label="Proof over courses" title="Growth ends with evidence." description="A skill is complete when a resume line or approved repository proves it, not when a checkbox is clicked." />
        </div>
      </section>

      <section className="bg-[#36454f] px-5 py-16 text-white sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d3d3d3]">Start with what you already have</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Add one resume. Find one role worth the effort.</h2></div><Link to="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#36454f] hover:bg-[#eef0f1]">Create workspace <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </main>

    <footer className="border-t border-slate-200 bg-[#f4f5f5] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs text-slate-500"><p className="font-black text-[#36454f]">CareerPilot</p><p>© {new Date().getFullYear()} · Student Application OS</p></div></footer>
  </div>
);


const ProductPreview = () => (
  <div className="relative rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_28px_80px_rgba(15,42,67,0.14)]">
    <div className="rounded-[1.25rem] bg-[#eef0f1] p-4 sm:p-6">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#36454f]">Today’s next move</p><p className="mt-1 text-sm font-black text-[#36454f]">Review a role before you tailor</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#36454f] text-[10px] font-black text-white">CP</span></div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">Graduate Backend Engineer</p><p className="mt-1 text-xs text-slate-500">Bengaluru · Full-time</p></div><span className="rounded-full bg-[#eef0f1] px-2 py-1 text-[10px] font-bold text-[#36454f]">Provider job page</span></div>
        <div className="mt-5 grid grid-cols-[5rem_1fr] gap-4"><div className="grid h-20 place-items-center rounded-xl bg-[#eef0f1]"><div className="text-center"><p className="text-2xl font-black text-[#36454f]">75%</p><p className="text-[9px] font-bold uppercase text-[#708090]">coverage</p></div></div><div className="space-y-2"><EvidenceRow status="Evidence" value="Python · FastAPI · SQL" good /><EvidenceRow status="Gap" value="Docker" /><EvidenceRow status="Gate" value="No blocking requirement" good /></div></div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Resume version</p><p className="mt-2 text-xs font-bold text-slate-800">Original stays unchanged</p></div><div className="rounded-xl bg-[#36454f] p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d3d3d3]">Next action</p><p className="mt-2 text-xs font-bold">Tailor with approved evidence</p></div></div>
    </div>
  </div>
);


const EvidenceRow = ({ status, value, good = false }) => <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-[11px] last:border-0"><span className={`font-bold ${good ? 'text-emerald-700' : 'text-amber-700'}`}>{status}</span><span className="truncate text-slate-600">{value}</span></div>;
const WorkflowStep = ({ number, icon, title, description }) => <article className="bg-white p-6"><div className="flex items-center justify-between"><span className="text-xs font-black text-slate-300">{number}</span>{icon}</div><h3 className="mt-10 font-black text-[#36454f]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></article>;
const Principle = ({ label, title, description }) => <article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#36454f]">{label}</p><h3 className="mt-3 text-xl font-black tracking-[-0.025em] text-[#36454f]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></article>;

export default LandingPage;
