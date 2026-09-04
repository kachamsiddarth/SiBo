import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { formatNumber, formatPercent, formatDate } from '../utils/formatters.js';

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
    <div className="page-content history-view" style={{ padding: 'var(--sibo-space-2xl) 2rem' }}>
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
            Reconciliation Run History
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)'
          }}>
            Audit log of all past reconciliation dataset executions stored in Supabase
          </p>
        </div>

        <button
          onClick={fetchRuns}
          className="btn btn-outline-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh History</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--sibo-space-3xl)', textAlign: 'center' }}>
          <RefreshCw size={28} className="spin" style={{ color: 'var(--sibo-primary)' }} />
          <p style={{ marginTop: 'var(--sibo-space-md)', color: 'var(--sibo-text-muted)' }}>
            Loading run history from Supabase...
          </p>
        </div>
      ) : runs.length === 0 ? (
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
            <HistoryIcon size={40} style={{ color: 'var(--sibo-info)' }} />
          </div>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--sibo-text-primary)',
            marginBottom: 'var(--sibo-space-sm)'
          }}>
            No reconciliation runs yet
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)',
            lineHeight: 1.6
          }}>
            No past reconciliation run records exist in the database
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sibo-space-lg)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sibo-space-sm)',
            marginBottom: 'var(--sibo-space-lg)'
          }}>
            <Calendar size={20} style={{ color: 'var(--sibo-text-muted)' }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--sibo-text-muted)'
            }}>
              {runs.length} reconciliation {runs.length === 1 ? 'run' : 'runs'} recorded
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>File Name</th>
                  <th>Total Records</th>
                  <th>Match Rate</th>
                  <th>Execution Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <code className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {run.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {run.file_name}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {formatNumber(run.total_records || 0)}
                    </td>
                    <td>
                      <span className={`badge ${run.match_rate >= 95 ? 'badge-success' : run.match_rate >= 80 ? 'badge-warning' : 'badge-error'}`}>
                        {formatPercent(run.match_rate || 0)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--sibo-text-secondary)' }}>
                      {formatDate(run.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onNavigate('/results')}
                        className="btn btn-outline-secondary"
                        style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
                      >
                        <span>View Results</span>
                        <ArrowRight size={14} />
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