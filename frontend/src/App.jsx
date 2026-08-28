import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  History, 
  Activity,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function App() {
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
          }}>
            Si
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              SiBo <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 500, paddingLeft: '6px' }}>AI Finance Controller</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Razorpay Buildathon Track 04</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
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
                  fontWeight: 500,
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--primary-500)' : 'var(--text-muted)'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem'
          }}>
            <Activity size={14} color={backendHealth?.status === 'ok' ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
            <span style={{ color: 'var(--text-muted)' }}>
              Backend: {loading ? 'Checking...' : backendHealth?.status === 'ok' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<DashboardView health={backendHealth} />} />
          <Route path="/reconcile" element={<PlaceholderView title="Upload & Reconcile" icon={UploadCloud} />} />
          <Route path="/results" element={<PlaceholderView title="Reconciliation Results" icon={CheckCircle2} />} />
          <Route path="/exceptions" element={<PlaceholderView title="Exceptions & AI Investigation" icon={AlertTriangle} />} />
          <Route path="/knowledge" element={<KnowledgeView health={backendHealth} />} />
          <Route path="/history" element={<PlaceholderView title="Run History" icon={History} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '16px 28px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <span>SiBo AI Finance Controller &copy; 2026 — Razorpay Settlement Domain Engine</span>
        <span>Vector Embedding Model: Qwen/Qwen3-Embedding-0.6B (1024-dim)</span>
      </footer>
    </div>
  );
}

function DashboardView({ health }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Finance Operations Control Center</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Autonomous payment settlement reconciliation & AI evidence investigation pipeline.
        </p>
      </div>

      {/* System Status Banner */}
      <div className="glass-card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.1)' }}>
            <Cpu size={24} color="var(--primary-500)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Orchestration Engine</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>LangChain.js + Groq</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.1)' }}>
            <BookOpen size={24} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Embedding & Vector DB</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Qwen3-0.6B (1024d) + pgvector</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)' }}>
            <ShieldCheck size={24} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reconciliation Engine</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Deterministic Math Guard</div>
          </div>
        </div>
      </div>

      {/* Genuine Empty State for Dashboard */}
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UploadCloud size={32} color="var(--primary-500)" />
        </div>
        <div style={{ maxWidth: '480px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>No Reconciliation Runs Yet</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Upload a payment and settlement dataset CSV to trigger the deterministic reconciliation engine and run automated AI exception investigation.
          </p>
        </div>
        <Link to="/reconcile" className="btn btn-primary" style={{ marginTop: '8px' }}>
          <UploadCloud size={16} /> Upload First Dataset
        </Link>
      </div>
    </div>
  );
}

function KnowledgeView({ health }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>RAG Domain Knowledge Base</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Curated official Razorpay Settlement documentation sources.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
          Curated Source Material (Rag/sources/)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {[
            { id: '01', name: '01-about-settlements.md', title: 'About Settlements', size: '7.2 KB' },
            { id: '02', name: '02-settlement-breakup.md', title: 'Settlement Breakup & Fees', size: '9.6 KB' },
            { id: '03', name: '03-settlement-apis.md', title: 'Settlement APIs Workflow', size: '3.6 KB' },
            { id: '04', name: '04-settlement-api-reference.md', title: 'Settlement API Specification', size: '1.9 KB' },
            { id: '05', name: '05-settlement-faqs.md', title: 'Settlement FAQs', size: '1.9 KB' },
            { id: '06', name: '06-settlement-details.md', title: 'Settlement Details & Reports', size: '5.3 KB' },
          ].map((file) => (
            <div key={file.id} style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={20} color="var(--accent-cyan)" />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{file.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{file.name}</div>
                </div>
              </div>
              <span className="badge badge-info">{file.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ title, icon: Icon }) {
  return (
    <div className="glass-card" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color="var(--primary-500)" />
      </div>
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          This view will be dynamically populated in subsequent implementation phases.
        </p>
      </div>
    </div>
  );
}
