import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertOctagon, Play, FileText, RefreshCw, Zap } from 'lucide-react';

export function ReconcileView({ onNavigate }) {
  const [paymentsFile, setPaymentsFile] = useState(null);
  const [settlementsFile, setSettlementsFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationSummary, setValidationSummary] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load synthetic dataset preset directly
  const handleSyntheticPreset = async () => {
    setErrorMsg(null);
    setValidating(true);
    setValidationSummary(null);

    try {
      // Generate synthetic dataset matching Phase 4 schema and scenarios
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

        // Introduce scenarios: record 3 amount mismatch, record 7 component mismatch
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

        if (i !== 5) { // record 5 missing settlement
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          DATASET UPLOADER & RECONCILIATION
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
          Upload financial payment and settlement CSV files or load a pre-configured synthetic dataset.
        </p>
      </div>

      {errorMsg && (
        <div className="neo-card" style={{ borderColor: 'var(--primary-red)', background: '#2c0b0e', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontWeight: 700 }}>
            <AlertOctagon color="var(--primary-red)" size={20} />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Preset Banner */}
      <div className="neo-card neo-card-yellow" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--primary-yellow)" /> QUICK TEST PRESET (SYNTHETIC DATASET)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Generates 100 payments and 92 settlements with built-in Razorpay discrepancy scenarios (`AMOUNT_MISMATCH`, `DUPLICATE_TRANSACTION`, `MISSING_SETTLEMENT`, etc.).
          </p>
        </div>
        <button 
          onClick={handleSyntheticPreset} 
          disabled={validating}
          className="btn btn-primary"
        >
          {validating ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
          Load Synthetic Dataset
        </button>
      </div>

      {/* Upload Box */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Payment File Upload */}
        <div className="neo-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '12px', textTransform: 'uppercase' }}>
            1. Payment Records CSV
          </h3>
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setPaymentsFile(e.target.files[0])}
            style={{ width: '100%', padding: '10px', background: '#0f172a', border: '2px solid #334155', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
          />
          {paymentsFile && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 700 }}>
              Selected: {paymentsFile.name} ({(paymentsFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Settlement File Upload */}
        <div className="neo-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '12px', textTransform: 'uppercase' }}>
            2. Settlement Records CSV
          </h3>
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setSettlementsFile(e.target.files[0])}
            style={{ width: '100%', padding: '10px', background: '#0f172a', border: '2px solid #334155', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
          />
          {settlementsFile && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 700 }}>
              Selected: {settlementsFile.name} ({(settlementsFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      </div>

      {paymentsFile && settlementsFile && !validationSummary && (
        <button onClick={handleManualUpload} disabled={validating} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
          {validating ? <RefreshCw size={16} className="spin" /> : <UploadCloud size={16} />}
          Validate & Ingest Selected CSVs
        </button>
      )}

      {/* Validation Results Card */}
      {validationSummary && (
        <div className="neo-card neo-card-cyan" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 color="var(--primary-cyan)" size={20} /> DATASET VALIDATION SUCCESSFUL
            </h3>
            <span className="badge badge-info">Run ID: {validationSummary.runId}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: '#0f172a', padding: '16px', borderRadius: 'var(--radius-sm)', border: '2px solid #334155' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>PAYMENTS INGESTED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                {validationSummary.paymentFile?.validRows ?? validationSummary.paymentsIngested ?? 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>SETTLEMENTS INGESTED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                {validationSummary.settlementFile?.validRows ?? validationSummary.settlementsIngested ?? 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>SCHEMA STATUS</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: '4px' }}>VALIDATED</div>
            </div>
          </div>

          {!runResult ? (
            <button 
              onClick={handleStartReconciliation} 
              disabled={reconciling}
              className="btn btn-primary" 
              style={{ alignSelf: 'flex-start', marginTop: '8px' }}
            >
              {reconciling ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
              Run Deterministic Reconciliation Engine
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', background: '#1e293b', padding: '16px', borderRadius: 'var(--radius-sm)', border: '2px solid var(--primary-green)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> RECONCILIATION COMPLETED SUCCESSFULLY!
              </div>
              <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                Processed <strong>{runResult.totalRecords}</strong> transactions: 
                <span style={{ color: 'var(--primary-green)', fontWeight: 800, margin: '0 6px' }}>{runResult.matchedCount} Matched</span> and 
                <span style={{ color: 'var(--primary-red)', fontWeight: 800, margin: '0 6px' }}>{runResult.exceptionCount} Exceptions</span> 
                (Match Rate: <strong>{runResult.matchRate}%</strong>).
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => onNavigate('/results')} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                  View All Results
                </button>
                <button onClick={() => onNavigate('/exceptions')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  Inspect Exceptions & AI
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
