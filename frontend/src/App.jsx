import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, UserCircle, Moon, Sun, WalletCards, Sparkles } from 'lucide-react'
import axios from 'axios'
import Dashboard from './Dashboard'
import Expenses from './Expenses'
import Insights from './Insights'
import Profile from './Profile'
import AIChatBubble from './AIChatBubble'
import Onboarding from './Onboarding'
import './index.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/profile/`)
        if (!res.data.name) {
          setShowOnboarding(true)
        }
      } catch {
        setShowOnboarding(true)
      }
      setProfileLoaded(true)
    }
    checkProfile()
  }, [])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  if (!profileLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="onboarding-spinner" style={{ width: '32px', height: '32px' }}></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        <header className="app-header">
          <div className="app-header-logo">
            <div className="logo-container" style={{ position: 'relative', width: '32px', height: '32px' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 8px var(--primary))' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="10 5" />
                <path d="M50 10 L50 90 M10 50 L90 50" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <path d="M30 70 L70 30" stroke="var(--secondary)" strokeWidth="6" strokeLinecap="round" />
                <circle cx="70" cy="30" r="4" fill="var(--bg)" stroke="var(--secondary)" strokeWidth="2" />
                <path d="M40 40 Q50 30 60 40 T80 40" fill="none" stroke="var(--tertiary)" strokeWidth="3" opacity="0.8" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>Expense Advisor</h1>
          </div>
          <div className="app-header-actions">
            <button className="header-action-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="header-action-btn" title="Notifications">
              <span className="notification-dot"></span>
              <span style={{ fontSize: '18px', fontWeight: 600 }}>🔔</span>
            </button>
          </div>
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
        <AIChatBubble />
      </div>
    </BrowserRouter>
  )
}
