import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink, RefreshCw, FileText, Database } from 'lucide-react';

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
      if (res.ok && data.results) {
        setSearchResults(data.results || []);
      } else {
        console.error('RAG Search returned error:', data);
        setSearchResults([]);
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
    <div className="page-content knowledge-view" style={{ padding: 'var(--sibo-space-2xl) 2rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--sibo-space-2xl)' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: 'var(--sibo-text-primary)',
          marginBottom: 'var(--sibo-space-xs)'
        }}>
          RAG Domain Knowledge Base
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--sibo-text-secondary)'
        }}>
          Vector search over 54 indexed chunks in Supabase pgvector using Qwen3-0.6B (1024d) embeddings
        </p>
      </div>

      {/* Vector Search Panel */}
      <div className="card" style={{
        padding: 'var(--sibo-space-xl)',
        marginBottom: 'var(--sibo-space-2xl)',
        borderColor: 'var(--sibo-info)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sibo-space-sm)',
          marginBottom: 'var(--sibo-space-lg)'
        }}>
          <Database size={24} style={{ color: 'var(--sibo-info)' }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: 'var(--sibo-text-primary)'
          }}>
            Semantic Search
          </h3>
        </div>

        <form onSubmit={handleSearch} style={{
          display: 'flex',
          gap: 'var(--sibo-space-md)',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search Razorpay documentation (e.g. 'settlement fees', 'instant payout schedule', 'tax breakup')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '300px',
              padding: '0.75rem 1rem',
              fontSize: '0.9375rem',
              fontWeight: 600
            }}
          />
          <button
            type="submit"
            disabled={searching}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {searching ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Search RAG</span>
              </>
            )}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{
            marginTop: 'var(--sibo-space-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sibo-space-md)'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--sibo-info)'
            }}>
              Semantic Search Matches ({searchResults.length})
            </h4>
            {searchResults.map((match) => (
              <div
                key={match.id}
                style={{
                  background: 'var(--sibo-bg-surface-alt)',
                  padding: 'var(--sibo-space-lg)',
                  borderRadius: 'var(--sibo-radius-md)',
                  border: '1px solid var(--sibo-border)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--sibo-space-sm)',
                  flexWrap: 'wrap',
                  gap: 'var(--sibo-space-sm)'
                }}>
                  <span style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--sibo-text-primary)'
                  }}>
                    {match.title} — {match.section}
                  </span>
                  <span className="badge badge-info">
                    Similarity: {(match.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9375rem',
                  color: 'var(--sibo-text-secondary)',
                  lineHeight: 1.7
                }}>
                  {match.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indexed Sources */}
      <div className="card" style={{ padding: 'var(--sibo-space-xl)' }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 800,
          color: 'var(--sibo-text-primary)',
          marginBottom: 'var(--sibo-space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sibo-space-sm)'
        }}>
          <BookOpen size={24} style={{ color: 'var(--sibo-warning)' }} />
          Indexed Razorpay Documentation Sources
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--sibo-space-lg)'
        }}>
          {sources.map((file) => (
            <div
              key={file.id}
              style={{
                padding: 'var(--sibo-space-lg)',
                borderRadius: 'var(--sibo-radius-md)',
                background: 'var(--sibo-bg-surface-alt)',
                border: '1px solid var(--sibo-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sibo-space-sm)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--sibo-space-xs)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sibo-space-sm)'
                }}>
                  <FileText size={20} style={{ color: 'var(--sibo-warning)' }} />
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--sibo-text-primary)'
                  }}>
                    {file.title}
                  </span>
                </div>
                <span className="badge badge-info">
                  {file.size}
                </span>
              </div>

              <div style={{
                fontSize: '0.8125rem',
                color: 'var(--sibo-text-muted)',
                fontFamily: 'var(--font-mono)'
              }}>
                {file.name}
              </div>

              <div style={{
                fontSize: '0.875rem',
                color: 'var(--sibo-info)',
                fontWeight: 600
              }}>
                {file.section}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}