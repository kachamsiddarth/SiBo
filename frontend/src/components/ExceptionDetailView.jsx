import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, Cpu, BookOpen, CheckCircle2, ArrowLeft, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

export function ExceptionDetailView({ onNavigate }) {
  const { exceptionId } = useParams();
  const [exception, setException] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (exceptionId) {
      loadExceptionDetails();
    }
  }, [exceptionId]);

  const loadExceptionDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch exception metadata
      const excRes = await fetch(`/api/exceptions/${exceptionId}`);
      const excData = await excRes.json();
      if (!excData.success) throw new Error(excData.error?.message || 'Failed to load exception.');
      setException(excData.data);

      // 2. Fetch existing AI investigation if available
      const invRes = await fetch(`/api/ai/investigations/${exceptionId}`);
      if (invRes.ok) {
        const invData = await invRes.json();
        if (invData.success) {
          setInvestigation(invData.data);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiInvestigation = async () => {
    setInvestigating(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/ai/investigate/${exceptionId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'AI Investigation failed.');
      }
      setInvestigation(data.data);
      // Refresh exception status
      loadExceptionDetails();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setInvestigating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <RefreshCw size={28} className="spin" color="var(--primary-yellow)" />
        <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading exception details from Supabase...</p>
      </div>
    );
  }

  if (errorMsg || !exception) {
    return (
      <div className="neo-card" style={{ borderColor: 'var(--primary-red)', padding: '24px' }}>
        <h3 style={{ color: 'var(--primary-red)', fontWeight: 900 }}>EXCEPTION NOT FOUND</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{errorMsg || 'Could not locate exception record.'}</p>
        <button onClick={() => onNavigate('/exceptions')} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back to Exceptions Queue
        </button>
      </div>
    );
  }

  const result = exception.reconciliation_results || {};
  const evidence = result.evidence || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Button & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => onNavigate('/exceptions')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <ArrowLeft size={14} /> Back to Exceptions List
        </button>
        <span className="badge badge-warning">Category: {exception.category}</span>
      </div>

      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          EXCEPTION AUDIT: <span style={{ color: 'var(--primary-yellow)', fontFamily: 'var(--font-mono)' }}>{exception.transaction_id}</span>
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
          Deterministic operational calculation evidence and RAG-grounded AI investigation log.
        </p>
      </div>

      {/* Operational Evidence Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Rec Calculation Breakdown */}
        <div className="neo-card neo-card-yellow" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '14px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--primary-yellow)" /> Deterministic Calculation
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Amount:</span>
              <span style={{ fontWeight: 700 }}>₹{evidence.payment_amount || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Fee (-):</span>
              <span style={{ fontWeight: 700 }}>₹{evidence.fee || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tax (-):</span>
              <span style={{ fontWeight: 700 }}>₹{evidence.tax || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Adjustment / Refund:</span>
              <span style={{ fontWeight: 700 }}>₹{(evidence.adjustment || 0) - (evidence.refund || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px', color: 'var(--primary-yellow)' }}>
              <span style={{ fontWeight: 800 }}>EXPECTED SETTLEMENT:</span>
              <span style={{ fontWeight: 900 }}>₹{result.expected_settlement}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-cyan)' }}>
              <span style={{ fontWeight: 800 }}>ACTUAL SETTLEMENT:</span>
              <span style={{ fontWeight: 900 }}>₹{result.actual_settlement}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '2px solid #334155', color: 'var(--primary-red)' }}>
              <span style={{ fontWeight: 900 }}>VARIANCE DIFFERENCE:</span>
              <span style={{ fontWeight: 900 }}>₹{result.difference}</span>
            </div>
          </div>
        </div>

        {/* AI Action Panel */}
        <div className="neo-card neo-card-cyan" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--primary-cyan)" /> Groq LLM + RAG Agent
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Invokes the LangChain.js agent with 5 operational database tools and vector search over official Razorpay settlement documentation.
            </p>
          </div>

          <button
            onClick={handleRunAiInvestigation}
            disabled={investigating}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {investigating ? (
              <>
                <RefreshCw size={16} className="spin" /> AI Agent Investigating Exception...
              </>
            ) : (
              <>
                <Cpu size={16} /> {investigation ? 'Re-Run AI Investigation' : 'Investigate Exception with AI'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Investigation Results Output Card */}
      {investigation && (
        <div className="neo-card neo-card-cyan" style={{ padding: '28px', background: '#0a101d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid var(--primary-cyan)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu color="var(--primary-cyan)" size={22} /> AI EXCEPTION INVESTIGATION REPORT
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-info">Confidence: {investigation.confidence}</span>
              <span className="badge badge-success">Status: {investigation.status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Executive Summary */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-yellow)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Executive Summary
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600, marginTop: '4px', lineHeight: 1.6 }}>
                {investigation.summary}
              </p>
            </div>

            {/* Evidence List */}
            {Array.isArray(investigation.evidence) && investigation.evidence.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Retrieved Operational Evidence
                </h4>
                <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {investigation.evidence.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Reasoning */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Technical Reasoning & Policy Analysis
              </h4>
              <div style={{ background: '#141e33', padding: '16px', borderRadius: 'var(--radius-sm)', border: '2px solid #334155', marginTop: '6px', fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {investigation.reasoning}
              </div>
            </div>

            {/* Recommended Action */}
            <div style={{ background: '#1c220f', border: '2px solid var(--primary-green)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary-green)', textTransform: 'uppercase' }}>
                RECOMMENDED FINANCE OPERATIONS ACTION
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700, marginTop: '4px' }}>
                {investigation.recommended_action}
              </p>
            </div>

            {/* Cited Source URLs */}
            {Array.isArray(investigation.sources_used) && investigation.sources_used.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Authoritative Documentation Sources
                </h4>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {investigation.sources_used.map((src, i) => (
                    <a
                      key={i}
                      href={src.url || src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="badge badge-info"
                      style={{ textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <BookOpen size={12} /> {src.title || 'Razorpay Settlement Docs'} <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
