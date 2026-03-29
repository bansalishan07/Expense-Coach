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
            <div className="icon-box" style={{ background: 'var(--primary)', color: 'white', margin: 0 }}>
              <WalletCards size={24} />
            </div>
            <h1 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>AI Expense Coach</h1>
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
