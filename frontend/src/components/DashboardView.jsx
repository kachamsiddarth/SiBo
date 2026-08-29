import React, { useState, useEffect } from 'react';
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
  Database,
  ArrowRight,
  RefreshCw,
  Search,
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function DashboardView({ health, onNavigate }) {
  const [runs, setRuns] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [runsRes, excRes, summaryRes] = await Promise.all([
        fetch('/api/upload/runs'),
        fetch('/api/exceptions'),
        fetch('/api/dashboard/summary')
      ]);

      const runsData = await runsRes.json();
      const excData = await excRes.json();
      const summaryData = await summaryRes.json();

      if (runsData.success) setRuns(runsData.data || []);
      if (excData.success) setExceptions(excData.data || []);
      if (summaryData.success) setSummary(summaryData.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const latestRun = runs.length > 0 ? runs[0] : null;
  const totalProcessed = summary?.totalRecords ?? runs.reduce((acc, r) => acc + (r.total_records || 0), 0);
  const totalExceptions = summary?.totalExceptions ?? exceptions.length;
  const explainedExceptions = summary?.aiExplained ?? exceptions.filter(e => e.ai_investigation_status === 'COMPLETED').length;
  const overallMatchRate = summary?.overallMatchRate ?? (latestRun?.match_rate || 0);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            FINANCE OPERATIONS CONTROL CENTER
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            Autonomous payment settlement reconciliation & AI evidence investigation engine.
          </p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Metrics
        </button>
      </div>

      {/* System Status Cards — Neobrutalist Cards */}
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
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)', fontWeight: 700 }}>Supabase pgvector (54 Chunks)</div>
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

      {/* Metrics Banner or Empty State */}
      {runs.length === 0 ? (
        <div className="neo-card" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-card-alt)' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary-yellow)', border: '2px solid #000', boxShadow: '3px 3px 0px #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UploadCloud size={32} color="#000" />
          </div>
          <div style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>NO RECONCILIATION RUNS YET</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Upload payment and settlement CSV datasets or load a synthetic test dataset to run the deterministic reconciliation engine.
            </p>
          </div>
          <button onClick={() => onNavigate('/reconcile')} className="btn btn-primary" style={{ marginTop: '8px' }}>
            <UploadCloud size={18} /> Upload First Dataset
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="neo-card" style={{ background: '#1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Records</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>{totalProcessed}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across {runs.length} run(s)</div>
            </div>

            <div className="neo-card" style={{ background: '#1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Match Rate</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: '4px' }}>
                {overallMatchRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across all {runs.length} run(s)</div>
            </div>

            <div className="neo-card" style={{ background: '#1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Exceptions</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-red)', marginTop: '4px' }}>{totalExceptions}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Flagged by Rec Engine</div>
            </div>

            <div className="neo-card" style={{ background: '#1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Explained</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-cyan)', marginTop: '4px' }}>{explainedExceptions}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Investigated via Groq RAG</div>
            </div>
          </div>

          {/* Recent Exceptions Table */}
          <div className="neo-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
                Recent Reconciliation Exceptions
              </h3>
              <button onClick={() => onNavigate('/exceptions')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                View All Exceptions <ArrowRight size={14} />
              </button>
            </div>

            {exceptions.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No active exceptions found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #334155', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>TRANSACTION ID</th>
                      <th style={{ padding: '10px' }}>CATEGORY</th>
                      <th style={{ padding: '10px' }}>DIFFERENCE</th>
                      <th style={{ padding: '10px' }}>AI INVESTIGATION STATUS</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.slice(0, 5).map((exc) => (
                      <tr key={exc.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{exc.transaction_id}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="badge badge-warning">{exc.category}</span>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: exc.difference !== 0 ? 'var(--primary-red)' : '#fff' }}>
                          ₹{exc.difference}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge ${exc.ai_investigation_status === 'COMPLETED' ? 'badge-success' : 'badge-muted'}`}>
                            {exc.ai_investigation_status || 'PENDING'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <button 
                            onClick={() => onNavigate(`/exceptions/${exc.id}`)}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Inspect <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
