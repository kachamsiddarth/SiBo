import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink, RefreshCw, FileText } from 'lucide-react';

export function KnowledgeView() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), topK: 5, matchThreshold: 0.15 })
      });
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('RAG Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const sources = [
    { id: '01', name: '01-about-settlements.md', title: 'About Settlements', size: '7.2 KB', section: 'Settlement Flow & Schedule' },
    { id: '02', name: '02-settlement-breakup.md', title: 'Settlement Breakup & Fees', size: '9.6 KB', section: 'Fees, Tax & Adjustments' },
    { id: '03', name: '03-settlement-apis.md', title: 'Settlement APIs Workflow', size: '3.6 KB', section: 'On-Demand & Instant API' },
    { id: '04', name: '04-settlement-api-reference.md', title: 'Settlement API Specification', size: '1.9 KB', section: 'Endpoints & Parameters' },
    { id: '05', name: '05-settlement-faqs.md', title: 'Settlement FAQs', size: '1.9 KB', section: 'Disputes & Delays' },
    { id: '06', name: '06-settlement-details.md', title: 'Settlement Details & Reports', size: '5.3 KB', section: 'Reconciliation Reports' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          RAG DOMAIN KNOWLEDGE BASE
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
          Vector search over 54 indexed chunks in Supabase pgvector using Qwen3-0.6B (1024d) embeddings.
        </p>
      </div>

      {/* RAG Vector Search Bar */}
      <div className="neo-card neo-card-cyan" style={{ padding: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search Razorpay documentation (e.g. 'settlement fees', 'instant payout schedule', 'tax breakup')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#0f172a',
              border: '2px solid #334155',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          />
          <button type="submit" disabled={searching} className="btn btn-primary">
            {searching ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
            Search RAG
          </button>
        </form>

        {/* Vector Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary-cyan)', textTransform: 'uppercase' }}>
              Semantic Search Matches ({searchResults.length})
            </h4>
            {searchResults.map((match) => (
              <div key={match.id} style={{ background: '#0f172a', padding: '16px', borderRadius: 'var(--radius-sm)', border: '2px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{match.title} - {match.section}</span>
                  <span className="badge badge-info">Similarity: {(match.similarity * 100).toFixed(1)}%</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{match.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indexed Document Directory */}
      <div className="neo-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '16px', textTransform: 'uppercase' }}>
          Indexed Razorpay Documentation Sources
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {sources.map((file) => (
            <div key={file.id} style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              background: '#0f172a',
              border: '2px solid #334155',
              boxShadow: '3px 3px 0px #000',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color="var(--primary-yellow)" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{file.title}</span>
                </div>
                <span className="badge badge-info">{file.size}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-cyan)', fontWeight: 600 }}>
                {file.section}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
