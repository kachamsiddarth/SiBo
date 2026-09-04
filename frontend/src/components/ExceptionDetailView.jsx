import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, Cpu, BookOpen, CheckCircle2, ArrowLeft, RefreshCw, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatExceptionType, formatInvestigationStatus } from '../utils/formatters.js';

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
      const excRes = await fetch(`/api/exceptions/${exceptionId}`);
      const excData = await excRes.json();
      if (!excData.success) throw new Error(excData.error?.message || 'Failed to load exception.');
      setException(excData.data);

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
      loadExceptionDetails();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setInvestigating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--sibo-space-3xl)', textAlign: 'center' }}>
        <RefreshCw size={28} className="spin" style={{ color: 'var(--sibo-primary)' }} />
        <p style={{ marginTop: 'var(--sibo-space-md)', color: 'var(--sibo-text-muted)' }}>
          Loading exception details from Supabase...
        </p>
      </div>
    );
  }

  if (errorMsg || !exception) {
    return (
      <div className="container" style={{ padding: 'var(--sibo-space-2xl) 2rem' }}>
        <div className="card" style={{
          borderColor: 'var(--sibo-error)',
          background: 'var(--sibo-error-light)',
          padding: 'var(--sibo-space-lg)'
        }}>
          <h3 style={{
            color: 'var(--sibo-error)',
            fontWeight: 900,
            fontSize: '1.25rem',
            marginBottom: 'var(--sibo-space-sm)'
          }}>
            Exception Not Found
          </h3>
          <p style={{ color: 'var(--sibo-text-secondary)', marginBottom: 'var(--sibo-space-md)' }}>
            {errorMsg || 'Could not locate exception record.'}
          </p>
          <button
            onClick={() => onNavigate('/exceptions')}
            className="btn btn-outline-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Exceptions Queue</span>
          </button>
        </div>
      </div>
    );
  }

  const result = exception.reconciliation_results || {};
  const evidence = result.evidence || {};

  return (
    <div className="page-content exception-detail-view" style={{ padding: 'var(--sibo-space-2xl) 2rem' }}>
      {/* Back Button & Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--sibo-space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--sibo-space-md)'
      }}>
        <button
          onClick={() => onNavigate('/exceptions')}
          className="btn btn-outline-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Exceptions List</span>
        </button>

        <span className="badge badge-warning">
          {formatExceptionType(exception.category)}
        </span>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: 'var(--sibo-space-2xl)' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 900,
          color: 'var(--sibo-text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: 'var(--sibo-space-xs)'
        }}>
          Exception Audit
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--sibo-text-secondary)'
        }}>
          Deterministic operational calculation evidence and RAG-grounded AI investigation log
        </p>
      </div>

      {/* Transaction ID Display */}
      <div className="card" style={{
        padding: 'var(--sibo-space-lg)',
        marginBottom: 'var(--sibo-space-2xl)',
        background: 'var(--sibo-bg-surface-alt)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--sibo-space-md)'
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--sibo-text-muted)',
              marginBottom: 'var(--sibo-space-xs)'
            }}>
              Transaction ID
            </div>
            <code className="font-mono" style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--sibo-primary)'
            }}>
              {exception.transaction_id}
            </code>
          </div>
          <span className={`badge ${exception.ai_investigation_status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}`}>
            {formatInvestigationStatus(exception.ai_investigation_status)}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--sibo-space-lg)',
        marginBottom: 'var(--sibo-space-2xl)'
      }}>
        {/* Deterministic Calculation */}
        <div className="card" style={{ padding: 'var(--sibo-space-xl)' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--sibo-text-primary)',
            marginBottom: 'var(--sibo-space-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sibo-space-sm)'
          }}>
            <ShieldCheck size={20} style={{ color: 'var(--sibo-warning)' }} />
            Deterministic Calculation
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sibo-space-md)',
            fontSize: '0.9375rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 'var(--sibo-space-sm)',
              borderBottom: '1px solid var(--sibo-border)'
            }}>
              <span style={{ color: 'var(--sibo-text-muted)', fontWeight: 600 }}>Payment Amount</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ₹{evidence.payment_amount || 'N/A'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 'var(--sibo-space-sm)',
              borderBottom: '1px solid var(--sibo-border)'
            }}>
              <span style={{ color: 'var(--sibo-text-muted)', fontWeight: 600 }}>Fee (-)</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ₹{evidence.fee || 0}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 'var(--sibo-space-sm)',
              borderBottom: '1px solid var(--sibo-border)'
            }}>
              <span style={{ color: 'var(--sibo-text-muted)', fontWeight: 600 }}>Tax (-)</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ₹{evidence.tax || 0}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 'var(--sibo-space-sm)',
              borderBottom: '1px solid var(--sibo-border)'
            }}>
              <span style={{ color: 'var(--sibo-text-muted)', fontWeight: 600 }}>Adjustment / Refund</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ₹{((evidence.adjustment || 0) - (evidence.refund || 0)).toFixed(2)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 'var(--sibo-space-sm)',
              borderBottom: '2px solid var(--sibo-warning)',
              color: 'var(--sibo-warning)'
            }}>
              <span style={{ fontWeight: 800 }}>Expected Settlement</span>
              <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                ₹{result.expected_settlement}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 'var(--sibo-space-sm)',
              borderBottom: '2px solid var(--sibo-info)',
              color: 'var(--sibo-info)'
            }}>
              <span style={{ fontWeight: 800 }}>Actual Settlement</span>
              <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                ₹{result.actual_settlement}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 'var(--sibo-space-sm)',
              borderTop: '2px solid var(--sibo-border)',
              color: 'var(--sibo-error)'
            }}>
              <span style={{ fontWeight: 900 }}>Variance Difference</span>
              <span style={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                ₹{result.difference}
              </span>
            </div>
          </div>
        </div>

        {/* AI Investigation Panel */}
        <div className="card" style={{
          padding: 'var(--sibo-space-xl)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--sibo-text-primary)',
              marginBottom: 'var(--sibo-space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sibo-space-sm)'
            }}>
              <Cpu size={20} style={{ color: 'var(--sibo-info)' }} />
              Groq LLM + RAG Agent
            </h3>
            <p style={{
              fontSize: '0.9375rem',
              color: 'var(--sibo-text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--sibo-space-lg)'
            }}>
              Invokes the LangChain.js agent with 5 operational database tools and vector search over official Razorpay settlement documentation.
            </p>
          </div>

          <button
            onClick={handleRunAiInvestigation}
            disabled={investigating}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {investigating ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>AI Agent Investigating...</span>
              </>
            ) : (
              <>
                <Cpu size={16} />
                <span>{investigation ? 'Re-Run AI Investigation' : 'Investigate Exception with AI'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Investigation Results */}
      {investigation && (
        <div className="card" style={{
          padding: 'var(--sibo-space-xl)',
          borderColor: 'var(--sibo-info)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sibo-space-lg)',
            borderBottom: '2px solid var(--sibo-info)',
            paddingBottom: 'var(--sibo-space-md)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: 'var(--sibo-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sibo-space-sm)'
            }}>
              <Cpu size={24} style={{ color: 'var(--sibo-info)' }} />
              AI Exception Investigation Report
            </h3>
            <div style={{ display: 'flex', gap: 'var(--sibo-space-sm)' }}>
              <span className="badge badge-info">
                Confidence: {investigation.confidence}
              </span>
              <span className="badge badge-success">
                Status: {investigation.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sibo-space-lg)' }}>
            {/* Executive Summary */}
            <div>
              <h4 style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--sibo-warning)',
                marginBottom: 'var(--sibo-space-sm)'
              }}>
                Executive Summary
              </h4>
              <p style={{
                fontSize: '1rem',
                color: 'var(--sibo-text-primary)',
                fontWeight: 600,
                lineHeight: 1.7
              }}>
                {investigation.summary}
              </p>
            </div>

            {/* Evidence List */}
            {Array.isArray(investigation.evidence) && investigation.evidence.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--sibo-info)',
                  marginBottom: 'var(--sibo-space-sm)'
                }}>
                  Retrieved Operational Evidence
                </h4>
                <ul style={{
                  paddingLeft: '1.25rem',
                  marginTop: 'var(--sibo-space-sm)',
                  fontSize: '0.9375rem',
                  color: 'var(--sibo-text-secondary)',
                  lineHeight: 1.7
                }}>
                  {investigation.evidence.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Reasoning */}
            <div>
              <h4 style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--sibo-text-primary)',
                marginBottom: 'var(--sibo-space-sm)'
              }}>
                Technical Reasoning & Policy Analysis
              </h4>
              <div style={{
                background: 'var(--sibo-bg-surface-alt)',
                padding: 'var(--sibo-space-lg)',
                borderRadius: 'var(--sibo-radius-md)',
                border: '1px solid var(--sibo-border)',
                fontSize: '0.9375rem',
                color: 'var(--sibo-text-primary)',
                whiteSpace: 'pre-line',
                lineHeight: 1.7
              }}>
                {investigation.reasoning}
              </div>
            </div>

            {/* Recommended Action */}
            <div style={{
              background: 'var(--sibo-success-light)',
              border: '1px solid var(--sibo-success)',
              padding: 'var(--sibo-space-lg)',
              borderRadius: 'var(--sibo-radius-md)'
            }}>
              <h4 style={{
                fontSize: '0.8125rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: 'var(--sibo-success)',
                marginBottom: 'var(--sibo-space-sm)'
              }}>
                Recommended Finance Operations Action
              </h4>
              <p style={{
                fontSize: '1rem',
                color: 'var(--sibo-text-primary)',
                fontWeight: 700,
                lineHeight: 1.6
              }}>
                {investigation.recommended_action}
              </p>
            </div>

            {/* Source URLs */}
            {Array.isArray(investigation.sources_used) && investigation.sources_used.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--sibo-text-muted)',
                  marginBottom: 'var(--sibo-space-sm)'
                }}>
                  Authoritative Documentation Sources
                </h4>
                <div style={{ display: 'flex', gap: 'var(--sibo-space-sm)', flexWrap: 'wrap' }}>
                  {investigation.sources_used.map((src, i) => (
                    <a
                      key={i}
                      href={src.url || src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="badge badge-info"
                      style={{
                        textTransform: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        textDecoration: 'none'
                      }}
                    >
                      <BookOpen size={12} />
                      {src.title || 'Razorpay Settlement Docs'}
                      <ExternalLink size={10} />
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