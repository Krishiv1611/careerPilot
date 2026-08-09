import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';


const Navbar = () => (
  <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f4f5f5]/95 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link to="/" className="flex items-center gap-3" aria-label="CareerPilot home"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#36454f] text-xs font-black text-white">CP</span><span><span className="block font-black tracking-[-0.02em] text-[#36454f]">CareerPilot</span><span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Student Application OS</span></span></Link>
      <div className="flex items-center gap-2"><Link to="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white">Log in</Link><Link to="/signup" className="inline-flex items-center gap-2 rounded-lg bg-[#36454f] px-4 py-2 text-sm font-bold text-white hover:bg-[#202a30]">Get started <ArrowRight className="h-4 w-4" /></Link></div>
    </div>
  </header>
);

export default Navbar;
