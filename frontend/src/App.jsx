import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, UserCircle, Moon, Sun, WalletCards, Sparkles } from 'lucide-react'
import Dashboard from './Dashboard'
import Expenses from './Expenses'
import Insights from './Insights'
import Profile from './Profile'
import './index.css'

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <BrowserRouter>
      <div className="app-container">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <header className="header-professional" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="logo-container" style={{ position: 'relative', width: '32px', height: '32px' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 8px var(--primary))' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="10 5" />
                <path d="M50 10 L50 90 M10 50 L90 50" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <path d="M30 70 L70 30" stroke="var(--secondary)" strokeWidth="6" strokeLinecap="round" />
                <circle cx="70" cy="30" r="4" fill="var(--bg)" stroke="var(--secondary)" strokeWidth="2" />
                <path d="M40 40 Q50 30 60 40 T80 40" fill="none" stroke="var(--tertiary)" strokeWidth="3" opacity="0.8" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Expense coach</h1>
          </div>
          <p className="text-sub" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '1.5rem', maxWidth: '300px' }}>
            Your portfolio is <span style={{ color: 'var(--primary)' }}>growing steadily.</span>
          </p>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={22} strokeWidth={2.5} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
             <WalletCards size={22} strokeWidth={2.5} />
             <span>Expenses</span>
          </NavLink>
          <NavLink to="/insights" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
             <Sparkles size={22} strokeWidth={2.5} />
             <span>AI Insights</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <UserCircle size={22} strokeWidth={2.5} />
            <span>Profile</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  )
}
