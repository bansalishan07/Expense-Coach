import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { BrainCircuit, UserCircle, Home } from 'lucide-react'
import Dashboard from './Dashboard'
import Profile from './Profile'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container animate-pulse" style={{ animationDuration: '3s', animationIterationCount: 1 }}>
        <header className="header" style={{ marginBottom: '2rem' }}>
          <h1>AI Expense & Saving Coach <BrainCircuit style={{ display: 'inline', marginLeft: 8 }} /></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Automated tracking with personalized insights</p>

          <nav className="top-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Home size={18} /> Dashboard
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <UserCircle size={18} /> Profile Setup
            </NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
