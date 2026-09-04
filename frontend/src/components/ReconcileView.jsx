import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Play, Zap, ArrowRight } from 'lucide-react';

export function ReconcileView({ onNavigate }) {
  const [paymentsFile, setPaymentsFile] = useState(null);
  const [settlementsFile, setSettlementsFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationSummary, setValidationSummary] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSyntheticPreset = async () => {
    setErrorMsg(null);
    setValidating(true);
    setValidationSummary(null);

    try {
      const paymentColumns = ['transaction_id', 'payment_amount', 'payment_date', 'payment_method', 'status', 'metadata'];
      const settlementColumns = ['settlement_id', 'transaction_id', 'payment_amount', 'fee', 'tax', 'adjustment', 'refund', 'settlement_amount', 'settlement_date', 'metadata'];

      const payments = [];
      const settlements = [];

      for (let i = 1; i <= 60; i++) {
        const txId = `TXN${String(i).padStart(6, '0')}`;
        const stlId = `STL${String(i).padStart(6, '0')}`;
        const pAmt = (1000 + i * 150).toFixed(2);
        const fee = (20 + i * 3).toFixed(2);
        const tax = (3.6 + i * 0.54).toFixed(2);
        let sAmt = (parseFloat(pAmt) - parseFloat(fee) - parseFloat(tax)).toFixed(2);

        if (i === 3) sAmt = (parseFloat(sAmt) + 50.00).toFixed(2);
        if (i === 7) sAmt = (parseFloat(sAmt) - 25.00).toFixed(2);

        payments.push({
          transaction_id: txId,
          payment_amount: pAmt,
          payment_date: '2026-08-28',
          payment_method: i % 2 === 0 ? 'CARD' : 'UPI',
          status: 'captured',
          metadata: JSON.stringify({ batch: 'synthetic' })
        });

        if (i !== 5) {
          settlements.push({
            settlement_id: stlId,
            transaction_id: txId,
            payment_amount: pAmt,
            fee,
            tax,
            adjustment: '0.00',
            refund: '0.00',
            settlement_amount: sAmt,
            settlement_date: '2026-08-29',
            metadata: JSON.stringify({ batch: 'synthetic' })
          });
        }
      }

      const toCsv = (arr, cols) => [
        cols.join(','),
        ...arr.map(r => cols.map(c => {
          const val = String(r[c] || '');
          if (val.includes('"') || val.includes(',') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(','))
      ].join('\n');
      const paymentCsv = toCsv(payments, paymentColumns);
      const settlementCsv = toCsv(settlements, settlementColumns);

      const formData = new FormData();
      formData.append('paymentFile', new Blob([paymentCsv], { type: 'text/csv' }), 'synthetic_payments.csv');
      formData.append('settlementFile', new Blob([settlementCsv], { type: 'text/csv' }), 'synthetic_settlements.csv');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to upload dataset.');
      }

      setValidationSummary(data.data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleManualUpload = async (e) => {
    e.preventDefault();
    if (!paymentsFile || !settlementsFile) {
      setErrorMsg('Please select both payment and settlement CSV files.');
      return;
    }

    setErrorMsg(null);
    setValidating(true);
    setValidationSummary(null);

    const formData = new FormData();
    formData.append('paymentFile', paymentsFile);
    formData.append('settlementFile', settlementsFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'CSV validation or ingestion failed.');
      }

      setValidationSummary(data.data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleStartReconciliation = async () => {
    if (!validationSummary || !validationSummary.runId) return;

    setReconciling(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/reconciliation/run/${validationSummary.runId}`, {
        method: 'POST'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Reconciliation engine execution failed.');
      }

      setRunResult(data.data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="page-content reconcile-view" style={{ padding: '3rem 2rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: 'var(--sibo-text-primary)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          Upload & Reconcile
        </h2>
        <p style={{
          fontSize: '1rem',
          color: 'var(--sibo-text-secondary)'
        }}>
          Upload payment and settlement CSV files or load a synthetic test dataset
        </p>
      </div>

      {/* Error Display */}
      {errorMsg && (
        <div className="card" style={{
          borderColor: 'var(--sibo-error)',
          background: 'var(--sibo-error-light)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ color: 'var(--sibo-error)', flexShrink: 0 }} />
          <span style={{ color: 'var(--sibo-error)', fontWeight: 600 }}>
            {errorMsg}
          </span>
        </div>
      )}

      {/* Quick Start - Synthetic Preset */}
      <div className="card" style={{
        padding: '1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, var(--sibo-primary-light) 0%, var(--sibo-bg-surface) 100%)',
        border: '1px solid var(--sibo-primary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <Zap size={20} style={{ color: 'var(--sibo-primary)' }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--sibo-text-primary)'
              }}>
                Quick test dataset
              </h3>
            </div>
            <p style={{
              fontSize: '0.9375rem',
              color: 'var(--sibo-text-secondary)'
            }}>
              Load 60 synthetic payment & settlement records with built-in discrepancy scenarios
            </p>
          </div>

          <button
            onClick={handleSyntheticPreset}
            disabled={validating}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {validating ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Load synthetic data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Payment Records Upload */}
        <div className="card" style={{
          padding: '1.5rem',
          borderStyle: 'dashed',
          borderColor: paymentsFile ? 'var(--sibo-success)' : 'var(--sibo-border)',
          background: paymentsFile ? 'var(--sibo-success-light)' : 'var(--sibo-bg-surface)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--sibo-primary-light)',
              borderRadius: 'var(--sibo-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileText size={24} style={{ color: 'var(--sibo-primary)' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--sibo-text-primary)',
                marginBottom: '0.5rem'
              }}>
                Payment transactions
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--sibo-text-secondary)'
              }}>
                CSV with transaction_id, payment_amount, payment_date, payment_method, status
              </p>
            </div>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setPaymentsFile(e.target.files[0])}
            style={{ marginBottom: '1rem' }}
          />

          {paymentsFile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              background: 'var(--sibo-bg-alt)',
              borderRadius: 'var(--sibo-radius-md)'
            }}>
              <CheckCircle2 size={16} style={{ color: 'var(--sibo-success)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--sibo-text-primary)' }}>
                {paymentsFile.name} ({(paymentsFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Settlement Records Upload */}
        <div className="card" style={{
          padding: '1.5rem',
          borderStyle: 'dashed',
          borderColor: settlementsFile ? 'var(--sibo-success)' : 'var(--sibo-border)',
          background: settlementsFile ? 'var(--sibo-success-light)' : 'var(--sibo-bg-surface)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--sibo-info-light)',
              borderRadius: 'var(--sibo-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileText size={24} style={{ color: 'var(--sibo-info)' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--sibo-text-primary)',
                marginBottom: '0.5rem'
              }}>
                Settlement records
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--sibo-text-secondary)'
              }}>
                CSV with settlement_id, transaction_id, payment_amount, fee, tax, settlement_amount, settlement_date
              </p>
            </div>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setSettlementsFile(e.target.files[0])}
            style={{ marginBottom: '1rem' }}
          />

          {settlementsFile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              background: 'var(--sibo-bg-alt)',
              borderRadius: 'var(--sibo-radius-md)'
            }}>
              <CheckCircle2 size={16} style={{ color: 'var(--sibo-success)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--sibo-text-primary)' }}>
                {settlementsFile.name} ({(settlementsFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Upload Button */}
      {paymentsFile && settlementsFile && !validationSummary && (
        <button
          onClick={handleManualUpload}
          disabled={validating}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}
        >
          {validating ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Validating & ingesting...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Validate & ingest files</span>
            </>
          )}
        </button>
      )}

      {/* Validation Success */}
      {validationSummary && (
        <div className="card" style={{
          borderColor: 'var(--sibo-success)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <CheckCircle2 size={24} style={{ color: 'var(--sibo-success)' }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--sibo-text-primary)'
            }}>
              Dataset validated successfully
            </h3>
            <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
              Run ID: {validationSummary.runId?.slice(0, 8)}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            padding: '1.5rem',
            background: 'var(--sibo-bg-alt)',
            borderRadius: 'var(--sibo-radius-lg)',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--sibo-text-muted)',
                marginBottom: '0.5rem'
              }}>
                Payments
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: 'var(--sibo-text-primary)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {validationSummary.paymentFile?.validRows ?? validationSummary.paymentsIngested ?? 0}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--sibo-text-muted)',
                marginBottom: '0.5rem'
              }}>
                Settlements
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: 'var(--sibo-text-primary)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {validationSummary.settlementFile?.validRows ?? validationSummary.settlementsIngested ?? 0}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--sibo-text-muted)',
                marginBottom: '0.5rem'
              }}>
                Schema
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--sibo-success)'
              }}>
                Validated
              </div>
            </div>
          </div>

          {!runResult ? (
            <button
              onClick={handleStartReconciliation}
              disabled={reconciling}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {reconciling ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Running reconciliation...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Start reconciliation</span>
                </>
              )}
            </button>
          ) : (
            <div style={{
              padding: '1.5rem',
              background: 'var(--sibo-success-light)',
              border: '1px solid var(--sibo-success)',
              borderRadius: 'var(--sibo-radius-lg)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <CheckCircle2 size={20} style={{ color: 'var(--sibo-success)' }} />
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--sibo-text-primary)'
                }}>
                  Reconciliation completed
                </h4>
              </div>

              <div style={{
                fontSize: '0.9375rem',
                color: 'var(--sibo-text-primary)',
                marginBottom: '1rem'
              }}>
                Processed <strong>{runResult.totalRecords}</strong> transactions:{' '}
                <span style={{ color: 'var(--sibo-success)', fontWeight: 700 }}>
                  {runResult.matchedCount} matched
                </span>{' '}
                <span style={{ color: 'var(--sibo-error)', fontWeight: 700 }}>
                  {runResult.exceptionCount} exceptions
                </span>{' '}
                (Match rate: <strong>{runResult.matchRate}%</strong>)
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onNavigate('/results')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                >
                  <span>View results</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => onNavigate('/exceptions')}
                  className="btn btn-outline-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                >
                  <span>View exceptions</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
