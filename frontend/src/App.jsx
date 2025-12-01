import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/auth/RequireAuth';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import UploadResume from './pages/UploadResume';
import SearchJobs from './pages/SearchJobs';
import AddJob from './pages/AddJob';
import Applications from './pages/Applications';
import CareerPilot from './pages/CareerPilot';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<LandingPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/upload" element={<RequireAuth><UploadResume /></RequireAuth>} />
            <Route path="/jobs" element={<RequireAuth><SearchJobs /></RequireAuth>} />
            <Route path="/add-job" element={<RequireAuth><AddJob /></RequireAuth>} />
            <Route path="/applications" element={<RequireAuth><Applications /></RequireAuth>} />
            <Route path="/careerpilot" element={<RequireAuth><CareerPilot /></RequireAuth>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
