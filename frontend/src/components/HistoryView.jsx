import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export function HistoryView({ onNavigate }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/upload/runs');
      const data = await res.json();
      if (data.success) {
        setRuns(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            RECONCILIATION RUN HISTORY
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            Audit log of all past reconciliation dataset executions stored in Supabase.
          </p>
        </div>
        <button onClick={fetchRuns} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh History
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <RefreshCw size={28} className="spin" color="var(--primary-yellow)" />
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading run history from Supabase...</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="neo-card" style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-card-alt)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>NO RECONCILIATION RUNS YET</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            No past reconciliation run records exist in the database.
          </p>
        </div>
      ) : (
        <div className="neo-card" style={{ padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 10px' }}>RUN ID</th>
                  <th style={{ padding: '12px 10px' }}>FILE NAME</th>
                  <th style={{ padding: '12px 10px' }}>TOTAL RECORDS</th>
                  <th style={{ padding: '12px 10px' }}>MATCH RATE</th>
                  <th style={{ padding: '12px 10px' }}>EXECUTION DATE</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{run.id.slice(0, 8)}...</td>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{run.file_name}</td>
                    <td style={{ padding: '12px 10px' }}>{run.total_records || 'N/A'}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-success">{run.match_rate || 0}%</span>
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => onNavigate('/results')}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        View Results <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
