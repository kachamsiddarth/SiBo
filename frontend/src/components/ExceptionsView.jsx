import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight, RefreshCw, Cpu, CheckCircle2 } from 'lucide-react';

export function ExceptionsView({ onNavigate }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            EXCEPTIONS & AI INVESTIGATION HUB
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            Reconciliation exception queue ready for Groq LLM + RAG agent analysis.
          </p>
        </div>
        <button onClick={fetchExceptions} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Exceptions
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <RefreshCw size={28} className="spin" color="var(--primary-yellow)" />
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading exceptions from Supabase...</p>
        </div>
      ) : exceptions.length === 0 ? (
        <div className="neo-card" style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-card-alt)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>NO RECONCILIATION EXCEPTIONS</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            All payment and settlement records match 100%, or no reconciliation runs exist.
          </p>
        </div>
      ) : (
        <div className="neo-card" style={{ padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 10px' }}>TRANSACTION ID</th>
                  <th style={{ padding: '12px 10px' }}>CATEGORY</th>
                  <th style={{ padding: '12px 10px' }}>VARIANCE DIFFERENCE</th>
                  <th style={{ padding: '12px 10px' }}>INVESTIGATION STATUS</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>AI ACTION</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((exc) => (
                  <tr key={exc.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{exc.transaction_id}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-warning">{exc.category}</span>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--primary-red)' }}>
                      ₹{exc.difference}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`badge ${exc.ai_investigation_status === 'COMPLETED' ? 'badge-success' : 'badge-muted'}`}>
                        {exc.ai_investigation_status === 'COMPLETED' ? 'INVESTIGATED' : 'UNINVESTIGATED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => onNavigate(`/exceptions/${exc.id}`)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Cpu size={14} /> Investigate Detail <ChevronRight size={12} />
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
