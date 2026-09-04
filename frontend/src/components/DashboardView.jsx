import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  BarChart3,
  Activity
} from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters.js';

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

  if (loading) {
    return (
      <div className="page-content" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--sibo-primary)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--sibo-text-muted)' }}>
          Loading dashboard metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="page-content dashboard-view" style={{ padding: '3rem 2rem' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--sibo-text-primary)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Finance Operations Dashboard
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)'
          }}>
            Real-time reconciliation metrics and AI investigation status
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="btn btn-outline-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {runs.length === 0 ? (
        /* Empty State */
        <div className="card" style={{
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--sibo-primary-light)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <BarChart3 size={40} style={{ color: 'var(--sibo-primary)' }} />
          </div>

          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--sibo-text-primary)',
            marginBottom: '0.75rem'
          }}>
            No reconciliation runs yet
          </h3>

          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)',
            marginBottom: '2rem',
            lineHeight: 1.6
          }}>
            Upload payment and settlement CSV datasets to run the deterministic
            reconciliation engine and start tracking your financial operations.
          </p>

          <button
            onClick={() => onNavigate('/reconcile')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>Upload First Dataset</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Total Records */}
            <div className="card">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'var(--sibo-primary-light)',
                  borderRadius: 'var(--sibo-radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Activity size={24} style={{ color: 'var(--sibo-primary)' }} />
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                  ALL TIME
                </span>
              </div>

              <div style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: 'var(--sibo-text-primary)',
                marginBottom: '0.5rem',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em'
              }}>
                {formatNumber(totalProcessed)}
              </div>

              <div style={{
                fontSize: '0.875rem',
                color: 'var(--sibo-text-muted)',
                fontWeight: 600
              }}>
                Total records processed
              </div>
            </div>

            {/* Match Rate */}
            <div className="card">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'var(--sibo-success-light)',
                  borderRadius: 'var(--sibo-radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--sibo-success)' }} />
                </div>
                <TrendingUp size={20} style={{ color: 'var(--sibo-success)' }} />
              </div>

              <div style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: 'var(--sibo-success)',
                marginBottom: '0.5rem',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em'
              }}>
                {formatPercent(overallMatchRate)}
              </div>

              <div style={{
                fontSize: '0.875rem',
                color: 'var(--sibo-text-muted)',
                fontWeight: 600
              }}>
                Overall match rate
              </div>
            </div>

            {/* Active Exceptions */}
            <div className="card">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'var(--sibo-warning-light)',
                  borderRadius: 'var(--sibo-radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={24} style={{ color: 'var(--sibo-warning)' }} />
                </div>
                <button
                  onClick={() => onNavigate('/exceptions')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--sibo-primary)'
                  }}
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              <div style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: 'var(--sibo-text-primary)',
                marginBottom: '0.5rem',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em'
              }}>
                {formatNumber(totalExceptions)}
              </div>

              <div style={{
                fontSize: '0.875rem',
                color: 'var(--sibo-text-muted)',
                fontWeight: 600
              }}>
                Active exceptions
              </div>
            </div>

            {/* AI Investigated */}
            <div className="card">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'var(--sibo-info-light)',
                  borderRadius: 'var(--sibo-radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={24} style={{ color: 'var(--sibo-info)' }} />
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                  AI
                </span>
              </div>

              <div style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: 'var(--sibo-text-primary)',
                marginBottom: '0.5rem',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em'
              }}>
                {formatNumber(explainedExceptions)}
              </div>

              <div style={{
                fontSize: '0.875rem',
                color: 'var(--sibo-text-muted)',
                fontWeight: 600
              }}>
                AI-investigated cases
              </div>
            </div>
          </div>

          {/* Recent Exceptions Table */}
          {exceptions.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--sibo-text-primary)'
                }}>
                  Recent exceptions
                </h3>

                <button
                  onClick={() => onNavigate('/exceptions')}
                  className="btn btn-outline-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  <span>View all</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Category</th>
                      <th>Variance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.slice(0, 5).map((exc) => (
                      <tr key={exc.id}>
                        <td>
                          <code className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {exc.transaction_id}
                          </code>
                        </td>
                        <td>
                          <span className="badge badge-warning">
                            {exc.category?.toLowerCase().replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{
                          fontWeight: 700,
                          color: exc.difference !== 0 ? 'var(--sibo-error)' : 'var(--sibo-text-primary)',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          ₹{exc.difference}
                        </td>
                        <td>
                          <span className={`badge ${exc.ai_investigation_status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}`}>
                            {exc.ai_investigation_status === 'COMPLETED' ? 'Investigated' : 'Needs investigation'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => onNavigate(`/exceptions/${exc.id}`)}
                            className="btn btn-outline-secondary"
                            style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
                          >
                            <span>Inspect</span>
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
        </>
      )}
    </div>
  );
}
