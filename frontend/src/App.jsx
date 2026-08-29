import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  History, 
  Activity,
  Database
} from 'lucide-react';

import { DashboardView } from './components/DashboardView.jsx';
import { ReconcileView } from './components/ReconcileView.jsx';
import { ResultsView } from './components/ResultsView.jsx';
import { ExceptionsView } from './components/ExceptionsView.jsx';
import { ExceptionDetailView } from './components/ExceptionDetailView.jsx';
import { KnowledgeView } from './components/KnowledgeView.jsx';
import { HistoryView } from './components/HistoryView.jsx';

export default function App() {
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setBackendHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to reach backend:', err);
        setBackendHealth({ status: 'error' });
        setLoading(false);
      });
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/reconcile', label: 'Upload & Reconcile', icon: UploadCloud },
    { path: '/results', label: 'Results', icon: CheckCircle2 },
    { path: '/exceptions', label: 'Exceptions & AI', icon: AlertTriangle },
    { path: '/knowledge', label: 'RAG Knowledge', icon: BookOpen },
    { path: '/history', label: 'Run History', icon: History },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
      {/* Top Navbar — Neobrutalist Style */}
      <header style={{
        background: '#0f172a',
        borderBottom: '2px solid #334155',
        padding: '16px 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--primary-yellow)',
            border: '2px solid #000',
            boxShadow: '3px 3px 0px #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 900,
            fontSize: '1.3rem'
          }}>
            Si
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>
              SiBo <span style={{ fontSize: '0.8rem', color: 'var(--primary-yellow)', fontWeight: 700, paddingLeft: '6px' }}>AI FINANCE CONTROLLER</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Razorpay Settlement Domain Engine</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isActive ? '#000' : 'var(--text-main)',
                  background: isActive ? 'var(--primary-yellow)' : '#1e293b',
                  border: '2px solid #000',
                  boxShadow: isActive ? '3px 3px 0px #000' : '2px 2px 0px #000',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#000' : 'var(--text-main)'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`badge ${backendHealth?.status === 'ok' ? 'badge-success' : 'badge-error'}`}>
            <Activity size={12} style={{ marginRight: '4px' }} />
            API: {loading ? 'CHECKING...' : backendHealth?.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span className={`badge ${backendHealth?.services?.supabase === 'connected' ? 'badge-info' : 'badge-warning'}`}>
            <Database size={12} style={{ marginRight: '4px' }} />
            DB: {backendHealth?.services?.supabase || 'UNCONFIGURED'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<DashboardView health={backendHealth} onNavigate={navigate} />} />
          <Route path="/reconcile" element={<ReconcileView onNavigate={navigate} />} />
          <Route path="/results" element={<ResultsView onNavigate={navigate} />} />
          <Route path="/exceptions" element={<ExceptionsView onNavigate={navigate} />} />
          <Route path="/exceptions/:exceptionId" element={<ExceptionDetailView onNavigate={navigate} />} />
          <Route path="/knowledge" element={<KnowledgeView />} />
          <Route path="/history" element={<HistoryView onNavigate={navigate} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '2px solid #334155',
        padding: '16px 28px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0f172a'
      }}>
        <span>SiBo AI Finance Controller &copy; 2026 — Track 04 Buildathon</span>
        <span>LLM: openai/gpt-oss-120b | Embeddings: Qwen3-0.6B (1024d)</span>
      </footer>
    </div>
  );
}
