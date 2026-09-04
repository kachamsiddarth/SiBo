import React, { useState, useEffect } from 'react';
import { AlertTriangle, Sparkles, Filter, Search, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatExceptionType, formatInvestigationStatus } from '../utils/formatters.js';

export function ExceptionsView({ onNavigate }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exceptions');
      const data = await res.json();
      if (data.success) {
        setExceptions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExceptions = exceptions.filter((exc) => {
    const matchesCategory = filterCategory === 'ALL' || exc.category === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || exc.ai_investigation_status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      exc.transaction_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const categories = ['ALL', ...Array.from(new Set(exceptions.map(e => e.category)))];
  const statuses = ['ALL', 'PENDING', 'COMPLETED'];

  const pendingCount = exceptions.filter(e => e.ai_investigation_status === 'PENDING').length;
  const investigatedCount = exceptions.filter(e => e.ai_investigation_status === 'COMPLETED').length;

  return (
    <div className="page-content exceptions-view" style={{ padding: 'var(--sibo-space-2xl) 2rem' }}>
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
            Exceptions & AI Investigation
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)'
          }}>
            Financial discrepancies detected by reconciliation engine with AI-powered root cause analysis
          </p>
        </div>

        <button
          onClick={fetchExceptions}
          className="btn btn-outline-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--sibo-space-lg)',
        marginBottom: 'var(--sibo-space-2xl)'
      }}>
        <div className="card" style={{ padding: 'var(--sibo-space-lg)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sibo-space-sm)',
            marginBottom: 'var(--sibo-space-md)'
          }}>
            <AlertTriangle size={20} style={{ color: 'var(--sibo-warning)' }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--sibo-text-muted)'
            }}>
              Total exceptions
            </span>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--sibo-text-primary)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {exceptions.length}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sibo-space-lg)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sibo-space-sm)',
            marginBottom: 'var(--sibo-space-md)'
          }}>
            <Sparkles size={20} style={{ color: 'var(--sibo-info)' }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--sibo-text-muted)'
            }}>
              AI investigated
            </span>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--sibo-text-primary)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {investigatedCount}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sibo-space-lg)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sibo-space-sm)',
            marginBottom: 'var(--sibo-space-md)'
          }}>
            <CheckCircle2 size={20} style={{ color: 'var(--sibo-text-muted)' }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--sibo-text-muted)'
            }}>
              Needs investigation
            </span>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--sibo-text-primary)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {pendingCount}
          </div>
        </div>
      </div>

      {exceptions.length === 0 ? (
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
            background: 'var(--sibo-success-light)',
            borderRadius: 'var(--sibo-radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--sibo-space-lg)'
          }}>
            <CheckCircle2 size={40} style={{ color: 'var(--sibo-success)' }} />
          </div>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--sibo-text-primary)',
            marginBottom: 'var(--sibo-space-sm)'
          }}>
            No exceptions found
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--sibo-text-secondary)',
            lineHeight: 1.6
          }}>
            All transactions reconciled successfully. Run a new reconciliation to detect discrepancies.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sibo-space-lg)' }}>
          {/* Filters & Search */}
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
              gap: 'var(--sibo-space-md)',
              flexWrap: 'wrap'
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
                  Category:
                </span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'All' : formatExceptionType(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sibo-space-sm)'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--sibo-text-muted)'
                }}>
                  Status:
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st === 'ALL' ? 'All' : formatInvestigationStatus(st)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '0.75rem',
                color: 'var(--sibo-text-muted)'
              }} />
              <input
                type="text"
                placeholder="Search by transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  minWidth: '240px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Results Count */}
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--sibo-text-muted)',
            fontWeight: 600,
            marginBottom: 'var(--sibo-space-lg)'
          }}>
            Showing {filteredExceptions.length} of {exceptions.length} exceptions
          </div>

          {/* Exceptions Table */}
          {loading ? (
            <div style={{ padding: 'var(--sibo-space-2xl)', textAlign: 'center' }}>
              <RefreshCw size={24} className="spin" style={{ color: 'var(--sibo-primary)' }} />
              <p style={{ marginTop: 'var(--sibo-space-sm)', color: 'var(--sibo-text-muted)' }}>
                Loading exceptions...
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Category</th>
                    <th>Variance</th>
                    <th>Expected</th>
                    <th>Actual</th>
                    <th>Investigation status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExceptions.map((exc) => (
                    <tr key={exc.id}>
                      <td>
                        <code className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {exc.transaction_id}
                        </code>
                      </td>
                      <td>
                        <span className="badge badge-warning">
                          {formatExceptionType(exc.category)}
                        </span>
                      </td>
                      <td style={{
                        fontWeight: 700,
                        color: exc.difference !== 0 ? 'var(--sibo-error)' : 'var(--sibo-text-primary)',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        ₹{exc.difference}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        ₹{exc.expected_settlement}
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        ₹{exc.actual_settlement}
                      </td>
                      <td>
                        <span className={`badge ${exc.ai_investigation_status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}`}>
                          {formatInvestigationStatus(exc.ai_investigation_status)}
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
          )}
        </div>
      )}
    </div>
  );
}
