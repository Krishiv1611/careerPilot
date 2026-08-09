import { useLocation } from 'react-router-dom';

import { useAuth } from '../../context/auth-context';
import AppSidebar from './AppSidebar';
import MobileNavigation from './MobileNavigation';
import Navbar from './Navbar';


const publicPaths = new Set(['/', '/login', '/signup']);


const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isPublic = !user || publicPaths.has(location.pathname);

  if (isPublic) {
    return (
      <div className="min-h-screen bg-[#f4f5f5] font-sans text-slate-950 antialiased">
        <Navbar />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="product-shell flex min-h-screen bg-[#f4f5f5] font-sans text-slate-950 antialiased">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-[#f4f5f5] px-5 md:hidden">
          <div>
            <p className="text-sm font-black tracking-[-0.02em] text-[#36454f]">CareerPilot</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Student workspace</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#36454f] text-xs font-black text-white">CP</span>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 pb-28 sm:px-8 md:px-10 md:py-10 md:pb-10">
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
};

export default Layout;
