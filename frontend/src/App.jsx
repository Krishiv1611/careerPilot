import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import RequireAuth from './components/auth/RequireAuth';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Home = lazy(() => import('./pages/Home'));
const SearchJobs = lazy(() => import('./pages/SearchJobs'));
const UploadResume = lazy(() => import('./pages/UploadResume'));
const ResumeStudio = lazy(() => import('./pages/ResumeStudio'));
const Applications = lazy(() => import('./pages/Applications'));
const Growth = lazy(() => import('./pages/Growth'));
const Settings = lazy(() => import('./pages/Settings'));

const PageFallback = () => (
  <div className="grid min-h-[45vh] place-items-center" role="status" aria-label="Loading page">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E293B] border-t-cyan-400" />
  </div>
);

const Protected = ({ children }) => <RequireAuth>{children}</RequireAuth>;

function AppContent() {
  const location = useLocation();

  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={<Protected><Home /></Protected>} />
          <Route path="/jobs" element={<Protected><SearchJobs /></Protected>} />
          <Route path="/profile" element={<Protected><UploadResume /></Protected>} />
          <Route path="/profile/tailor" element={<Protected><ResumeStudio /></Protected>} />
          <Route path="/applications" element={<Protected><Applications /></Protected>} />
          <Route path="/growth" element={<Protected><Growth /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />

          <Route path="/upload" element={<Navigate replace to="/profile" />} />
          <Route path="/add-job" element={<Navigate replace to="/jobs" />} />
          <Route path="/analyze-jd" element={<Navigate replace to="/profile" />} />
          <Route path="/careerpilot" element={<Navigate replace to="/jobs" />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
