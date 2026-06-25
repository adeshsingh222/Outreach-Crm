import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './features/dashboard/Dashboard';
import Companies from './features/companies/Companies';
import ImportLeadsPage from './pages/ImportLeadsPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import { useAppStore } from './lib/store';

export default function App() {
  const fetchCompanies = useAppStore(state => state.fetchCompanies);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetailsPage />} />
          <Route path="/import" element={<ImportLeadsPage />} />
          {/* Fallback routes for demo */}
          <Route path="/resumes" element={<div className="p-8">Resumes Page (Coming Soon)</div>} />
          <Route path="/settings" element={<div className="p-8">Settings Page (Coming Soon)</div>} />
        </Routes>
      </AppShell>
    </Router>
  );
}
