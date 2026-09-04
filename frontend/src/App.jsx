import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Upload,
  BarChart3,
  Sparkles,
  BookOpen,
  History,
  Menu,
  X,
  Sun,
  ChevronDown
} from 'lucide-react';

import { DashboardView } from './components/DashboardView.jsx';
import { ReconcileView } from './components/ReconcileView.jsx';
import { ResultsView } from './components/ResultsView.jsx';
import { ExceptionsView } from './components/ExceptionsView.jsx';
import { ExceptionDetailView } from './components/ExceptionDetailView.jsx';
import { KnowledgeView } from './components/KnowledgeView.jsx';
import { HistoryView } from './components/HistoryView.jsx';
import { LandingHero } from './components/LandingHero.jsx';

export default function App() {
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setBackendHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to reach backend:', err);
        setBackendHealth({ status: 'error' });
        setLoading(false);
      });
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/reconcile', label: 'Upload & Reconcile', icon: Upload },
    { path: '/results', label: 'Results', icon: BarChart3 },
    { path: '/exceptions', label: 'Exceptions & AI', icon: Sparkles },
    { path: '/knowledge', label: 'RAG Knowledge', icon: BookOpen },
    { path: '/history', label: 'Run History', icon: History },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div id="root">
      {/* Clean Horizontal Navbar */}
      <header>
        <div className="container">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
              </svg>
            </div>
            <div className="navbar-logo-text">
              <strong>SiBo</strong>
              <span>AI Finance Controller</span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={active ? 'active' : ''}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="navbar-right">
            {/* Theme Toggle */}
            <button className="theme-toggle-btn" aria-label="Toggle theme">
              <Sun size={20} />
            </button>

            {/* User Profile */}
            <div className="user-profile">
              <div className="user-avatar">SK</div>
              <span className="user-name">Siddharth K</span>
              <ChevronDown size={16} className="user-chevron" />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={active ? 'active' : ''}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<LandingHero onNavigate={navigate} />} />
          <Route path="/dashboard" element={<DashboardView health={backendHealth} onNavigate={navigate} />} />
          <Route path="/reconcile" element={<ReconcileView onNavigate={navigate} />} />
          <Route path="/results" element={<ResultsView onNavigate={navigate} />} />
          <Route path="/exceptions" element={<ExceptionsView onNavigate={navigate} />} />
          <Route path="/exceptions/:exceptionId" element={<ExceptionDetailView onNavigate={navigate} />} />
          <Route path="/knowledge" element={<KnowledgeView />} />
          <Route path="/history" element={<HistoryView onNavigate={navigate} />} />
        </Routes>
      </main>
    </div>
  );
}
