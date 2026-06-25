import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './features/dashboard/Dashboard';
import Companies from './features/companies/Companies';
import ImportLeadsPage from './pages/ImportLeadsPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import Login from './pages/Login';
import ResumesPage from './pages/ResumesPage';
import { useAppStore } from './lib/store';

export default function App() {
  const fetchCompanies = useAppStore(state => state.fetchCompanies);
  const checkAuth = useAppStore(state => state.checkAuth);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const isLoadingAuth = useAppStore(state => state.isLoadingAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
    }
  }, [isAuthenticated, fetchCompanies]);

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetailsPage />} />
          <Route path="/import" element={<ImportLeadsPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/settings" element={<div className="p-8">Settings Page (Coming Soon)</div>} />
        </Routes>
      </AppShell>
    </Router>
  );
}
