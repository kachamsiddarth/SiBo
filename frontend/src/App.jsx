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
  Cpu,
  Database
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
        justifyContent: 'space-between'
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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        borderTop: '2px solid #334155',
        padding: '16px 28px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        fontWeight: 600,
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        background: '#0f172a'
      }}>
        <span>SiBo AI Finance Controller &copy; 2026 — Track 04 Buildathon</span>
        <span>LLM: openai/gpt-oss-120b | Embeddings: Qwen3-0.6B (1024d)</span>
      </footer>
    </div>
  );
}

function DashboardView({ health }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          FINANCE OPERATIONS CONTROL CENTER
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
          Autonomous payment settlement reconciliation & AI evidence investigation engine.
        </p>
      </div>

      {/* System Status Banner — Neobrutalist Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="neo-card neo-card-yellow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: '#000', border: '2px solid var(--primary-yellow)', borderRadius: 'var(--radius-sm)' }}>
              <Cpu size={24} color="var(--primary-yellow)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Reasoning Model</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{health?.llmModel || 'openai/gpt-oss-120b'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-yellow)', fontWeight: 700 }}>131K Token Reasoning Context</div>
            </div>
          </div>
        </div>

        <div className="neo-card neo-card-cyan">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: '#000', border: '2px solid var(--primary-cyan)', borderRadius: 'var(--radius-sm)' }}>
              <BookOpen size={24} color="var(--primary-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Embedding & Vector DB</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Qwen3-0.6B (1024d)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)', fontWeight: 700 }}>Supabase pgvector Schema Ready</div>
            </div>
          </div>
        </div>

        <div className="neo-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: '#000', border: '2px solid var(--primary-green)', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={24} color="var(--primary-green)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reconciliation Guard</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Deterministic Engine</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-green)', fontWeight: 700 }}>Zero Hallucination Math</div>
            </div>
          </div>
        </div>
      </div>

      {/* Genuine Empty State for Dashboard */}
      <div className="neo-card" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-card-alt)' }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--primary-yellow)', border: '2px solid #000', boxShadow: '3px 3px 0px #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UploadCloud size={32} color="#000" />
        </div>
        <div style={{ maxWidth: '520px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>NO RECONCILIATION RUNS YET</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Upload a payment and settlement dataset CSV to trigger the deterministic reconciliation engine and run automated AI exception investigation.
          </p>
        </div>
        <Link to="/reconcile" className="btn btn-primary" style={{ marginTop: '8px' }}>
          <UploadCloud size={18} /> Upload First Dataset
        </Link>
      </div>
    </div>
  );
}

function KnowledgeView({ health }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          RAG DOMAIN KNOWLEDGE BASE
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
          Curated official Razorpay Settlement documentation sources.
        </p>
      </div>

      <div className="neo-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '16px', textTransform: 'uppercase' }}>
          Curated Source Material (Rag/sources/)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
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
              background: '#0f172a',
              border: '2px solid #334155',
              boxShadow: '3px 3px 0px #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={20} color="var(--primary-cyan)" />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{file.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{file.name}</div>
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
    <div className="neo-card" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-card-alt)' }}>
      <div style={{ width: '56px', height: '56px', background: 'var(--primary-yellow)', border: '2px solid #000', boxShadow: '3px 3px 0px #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color="#000" />
      </div>
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '8px', textTransform: 'uppercase' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          This view will be dynamically populated in subsequent implementation phases.
        </p>
      </div>
    </div>
  );
}
