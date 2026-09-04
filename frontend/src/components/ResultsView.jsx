import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, Filter, Search } from 'lucide-react';

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
    <div className="page-content results-view" style={{ padding: 'var(--sibo-space-2xl) 2rem' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--sibo-space-2xl)',
        flexWrap: 'wrap',
        gap: 'var(--sibo-space-md)'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--sibo-text-primary)',
            marginBottom: 'var(--sibo-space-xs)'
          }}>
            Reconciliation Results
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)'
          }}>
            Payment vs settlement comparison from deterministic reconciliation engine
          </p>
        </div>

        {runs.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sibo-space-sm)'
          }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--sibo-text-muted)'
            }}>
              Select run:
            </label>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              style={{
                minWidth: '280px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem'
              }}
            >
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.file_name} ({new Date(run.created_at).toLocaleDateString()}) — {run.match_rate}% matched
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {runs.length === 0 ? (
        /* Empty State */
        <div className="card" style={{
          padding: 'var(--sibo-space-3xl)',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--sibo-info-light)',
            borderRadius: 'var(--sibo-radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--sibo-space-lg)'
          }}>
            <CheckCircle2 size={40} style={{ color: 'var(--sibo-info)' }} />
          </div>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--sibo-text-primary)',
            marginBottom: 'var(--sibo-space-sm)'
          }}>
            No reconciliation results
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)',
            lineHeight: 1.6
          }}>
            Run a reconciliation from the Upload & Reconcile page to see results here.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sibo-space-lg)' }}>
          {/* Filter Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sibo-space-lg)',
            flexWrap: 'wrap',
            gap: 'var(--sibo-space-md)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sibo-space-sm)'
            }}>
              <Filter size={16} style={{ color: 'var(--sibo-text-muted)' }} />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--sibo-text-muted)'
              }}>
                Filter:
              </span>

              <div style={{ display: 'flex', gap: 'var(--sibo-space-xs)' }}>
                {['ALL', 'MATCHED', 'EXCEPTION'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                  >
                    {st.charAt(0) + st.slice(1).toLowerCase()} ({st === 'ALL' ? results.length : results.filter(r => r.status === st).length})
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              fontSize: '0.875rem',
              color: 'var(--sibo-text-muted)',
              fontWeight: 600
            }}>
              Showing {filteredResults.length} of {results.length}
            </div>
          </div>

          {/* Results Table */}
          {loading ? (
            <div style={{ padding: 'var(--sibo-space-2xl)', textAlign: 'center' }}>
              <RefreshCw size={24} className="spin" style={{ color: 'var(--sibo-primary)' }} />
              <p style={{ marginTop: 'var(--sibo-space-sm)', color: 'var(--sibo-text-muted)' }}>
                Loading results...
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Expected settlement</th>
                    <th>Actual settlement</th>
                    <th>Difference</th>
                    <th>Status</th>
                    <th>Exception type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((res) => (
                    <tr key={res.id}>
                      <td>
                        <code className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {res.transaction_id}
                        </code>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        ₹{res.expected_settlement}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        ₹{res.actual_settlement}
                      </td>
                      <td style={{
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 700,
                        color: res.difference !== 0 ? 'var(--sibo-error)' : 'var(--sibo-success)'
                      }}>
                        ₹{res.difference}
                      </td>
                      <td>
                        <span className={`badge ${res.status === 'MATCHED' ? 'badge-success' : 'badge-error'}`}>
                          {res.status === 'MATCHED' ? 'Matched' : 'Exception'}
                        </span>
                      </td>
                      <td>
                        {res.exception_type ? (
                          <span className="badge badge-warning">
                            {res.exception_type.toLowerCase().replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--sibo-text-muted)' }}>—</span>
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
