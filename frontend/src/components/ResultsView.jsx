import React, { useState, useEffect } from 'react';
import { Filter, CheckCircle2, AlertTriangle, RefreshCw, ArrowUpDown } from 'lucide-react';

export function ResultsView({ onNavigate }) {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [results, setResults] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      fetchResultsForRun(selectedRunId);
    }
  }, [selectedRunId]);

  const fetchRuns = async () => {
    try {
      const res = await fetch('/api/upload/runs');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setRuns(data.data);
        setSelectedRunId(data.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
      setLoading(false);
    }
  };

  const fetchResultsForRun = async (runId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reconciliation/results/${runId}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((r) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'MATCHED') return r.status === 'MATCHED';
    if (filterStatus === 'EXCEPTION') return r.status === 'EXCEPTION';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            DETERMINISTIC RECONCILIATION RESULTS
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            Exact mathematical payment vs settlement comparison log.
          </p>
        </div>

        {runs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>SELECT RUN:</span>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              style={{
                padding: '8px 14px',
                background: '#0f172a',
                border: '2px solid #334155',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.file_name} ({new Date(run.created_at).toLocaleDateString()}) - {run.match_rate}% Matched
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {runs.length === 0 ? (
        <div className="neo-card" style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-card-alt)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>NO RECONCILIATION RESULTS AVAILABLE</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Execute a reconciliation run from the Upload & Reconcile tab to generate results.
          </p>
        </div>
      ) : (
        <div className="neo-card" style={{ padding: '24px' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'MATCHED', 'EXCEPTION'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  {st} ({st === 'ALL' ? results.length : results.filter(r => r.status === st).length})
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Showing {filteredResults.length} of {results.length} record(s)
            </div>
          </div>

          {/* Results Table */}
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <RefreshCw size={24} className="spin" color="var(--primary-yellow)" />
              <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading results from Supabase...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 10px' }}>TRANSACTION ID</th>
                    <th style={{ padding: '12px 10px' }}>EXPECTED SETTLEMENT</th>
                    <th style={{ padding: '12px 10px' }}>ACTUAL SETTLEMENT</th>
                    <th style={{ padding: '12px 10px' }}>DIFFERENCE</th>
                    <th style={{ padding: '12px 10px' }}>STATUS</th>
                    <th style={{ padding: '12px 10px' }}>EXCEPTION TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((res) => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{res.transaction_id}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700 }}>₹{res.expected_settlement}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700 }}>₹{res.actual_settlement}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: res.difference !== 0 ? 'var(--primary-red)' : 'var(--primary-green)' }}>
                        ₹{res.difference}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className={`badge ${res.status === 'MATCHED' ? 'badge-success' : 'badge-error'}`}>
                          {res.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {res.exception_type ? (
                          <span className="badge badge-warning">{res.exception_type}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
