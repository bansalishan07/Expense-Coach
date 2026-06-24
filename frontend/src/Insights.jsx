import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Coffee,
  ShoppingBag,
  Home,
  Bus,
  Tv,
  HelpCircle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import './index.css'

const API_BASE = 'http://localhost:8000'

const categoryColors = ['#97A9FF', '#EA73FB', '#7BE0D3', '#FFD93D', '#6C63FF', '#FF716C']

export default function Insights() {
  const [expenses, setExpenses] = useState([])
  const [insights, setInsights] = useState({ total_spent: 0, predicted_next_month: 0, advice: '' })
  const [profile, setProfile] = useState({ target_amount: 0 })

  const fetchData = async () => {
    try {
      const [expRes, insRes, profRes] = await Promise.all([
        axios.get(`${API_BASE}/expenses/`),
        axios.get(`${API_BASE}/insights/`),
        axios.get(`${API_BASE}/profile/`)
      ])
      setExpenses(expRes.data)
      setInsights(insRes.data)
      setProfile(profRes.data)
    } catch (err) {
      console.error('Failed to fetch', err)
    }
  }

  useEffect(() => { fetchData() }, [])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()

  const thisMonthSpent = expenses.filter(e => e.date.startsWith(currentMonth)).reduce((a, e) => a + e.amount, 0)
  const lastMonthSpent = expenses.filter(e => e.date.startsWith(lastMonth)).reduce((a, e) => a + e.amount, 0)
  const budget = profile.target_amount || 0

  const healthScore = (() => {
    if (budget <= 0) return 75
    const ratio = thisMonthSpent / budget
    if (ratio <= 0.5) return 95
    if (ratio <= 0.75) return 82
    if (ratio <= 1) return 65
    return Math.max(20, 50 - (ratio - 1) * 30)
  })()

  const categoryBreakdown = (() => {
    const grouped = {}
    expenses.filter(e => e.date.startsWith(currentMonth)).forEach(e => {
      const cat = e.category || 'Uncategorized'
      grouped[cat] = (grouped[cat] || 0) + e.amount
    })
    return Object.entries(grouped)
      .map(([name, spent]) => ({ name, spent }))
      .sort((a, b) => b.spent - a.spent)
  })()

  const overspendingCategories = categoryBreakdown.filter(c => {
    const lastMonthCat = expenses
      .filter(e => e.date.startsWith(lastMonth) && (e.category || 'Uncategorized') === c.name)
      .reduce((a, e) => a + e.amount, 0)
    return lastMonthCat > 0 && c.spent > lastMonthCat * 1.2
  })

  const comparisonData = [
    { name: 'Last Month', amount: lastMonthSpent },
    { name: 'This Month', amount: thisMonthSpent }
  ]

  const weeklyTrend = (() => {
    const weeks = [0, 0, 0, 0]
    expenses.filter(e => e.date.startsWith(currentMonth)).forEach(e => {
      const day = new Date(e.date).getDate()
      const week = Math.min(3, Math.floor((day - 1) / 7))
      weeks[week] += e.amount
    })
    return weeks.map((val, i) => ({ week: `W${i + 1}`, amount: val }))
  })()

  const formatCur = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  const recommendations = [
    insights.advice ? { icon: <Sparkles size={20} />, title: 'AI Recommendation', text: insights.advice, accent: '#97A9FF' } : null,
    thisMonthSpent > lastMonthSpent ? { icon: <AlertTriangle size={20} />, title: 'Spending Alert', text: `You're spending ${formatCur(thisMonthSpent - lastMonthSpent)} more than last month. Consider reviewing your expenses.`, accent: '#FF6E84' } : null,
    thisMonthSpent < lastMonthSpent ? { icon: <ShieldCheck size={20} />, title: 'Great Progress!', text: `You've saved ${formatCur(lastMonthSpent - thisMonthSpent)} compared to last month. Keep it up!`, accent: '#7BE0D3' } : null,
    { icon: <Lightbulb size={20} />, title: 'Smart Tip', text: 'Setting a monthly budget helps you track spending more effectively. Try the budget feature in Profile.', accent: '#FFD93D' }
  ].filter(Boolean)

  const circumference = 2 * Math.PI * 60
  const progress = (healthScore / 100) * circumference

  return (
    <div className="page-layout">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BrainCircuit size={24} style={{ color: '#97A9FF', animation: 'pulseGlow 2s ease-in-out infinite' }} />
          <h2 className="page-title">Insights</h2>
        </div>
      </header>

      <div className="health-score-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="score-ring-container">
          <svg width="150" height="150" viewBox="0 0 150 150" className="neon-circle">
            <circle cx="75" cy="75" r="60" fill="none" stroke="rgba(69, 72, 79, 0.15)" strokeWidth="10" />
            <circle
              cx="75" cy="75" r="60" fill="none"
              stroke="url(#scoreGradient)" strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-deep)" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            <text x="75" y="78" textAnchor="middle" fill="var(--text-main)" fontSize="36" fontWeight="800" fontFamily="'Plus Jakarta Sans', sans-serif">
              {Math.round(healthScore)}
            </text>
            <text x="75" y="98" textAnchor="middle" fill="var(--text-sub)" fontSize="10" fontWeight="700" letterSpacing="0.1em">
              HEALTH
            </text>
          </svg>
        </div>
        <p className="score-label">Financial Health Score</p>
        <p className="text-sub" style={{ textAlign: 'center', maxWidth: '280px', margin: '0 auto' }}>
          {healthScore >= 80 ? 'Excellent! Your finances are in great shape.' :
           healthScore >= 60 ? 'Good progress, but there\'s room for improvement.' :
           'Needs attention. Consider reviewing your spending habits.'}
        </p>
      </div>

      <h3 className="section-title">
        <Sparkles size={18} style={{ color: '#97A9FF' }} /> Smart Recommendations
      </h3>
      <div className="recommendations-grid">
        {recommendations.map((rec, i) => (
          <div key={i} className="recommendation-card" style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="rec-icon" style={{ color: rec.accent, background: `${rec.accent}15` }}>
              {rec.icon}
            </div>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 700 }}>{rec.title === 'AI Recommendation' ? 'Smart Recommendation' : rec.title}</h4>
              <p className="text-sub" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5 }}>{rec.text}</p>
            </div>
          </div>
        ))}
      </div>

      <h3 className="section-title">
        <TrendingUp size={18} style={{ color: '#97A9FF' }} /> Spending Prediction
      </h3>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <p className="text-sub" style={{ fontSize: '0.75rem', margin: 0 }}>Next Month Forecast</p>
            <h3 className="display-lg" style={{ fontSize: '1.75rem' }}>{formatCur(insights.predicted_next_month)}</h3>
          </div>
          <ArrowUpRight size={24} style={{ color: '#97A9FF' }} />
        </div>
        {weeklyTrend.some(w => w.amount > 0) && (
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <Line type="monotone" dataKey="amount" stroke="#97A9FF" strokeWidth={2} dot={{ fill: '#97A9FF', r: 4 }} />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => formatCur(value)}
                  contentStyle={{ 
                    background: 'rgba(28, 32, 40, 0.85)', 
                    backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--text-main)',
                    padding: '4px 8px'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {overspendingCategories.length > 0 && (
        <>
          <h3 className="section-title">
            <AlertTriangle size={18} style={{ color: '#FF6E84' }} /> Budget Alerts
          </h3>
          {overspendingCategories.map((cat, i) => (
            <div key={i} className="alert-card" style={{ boxShadow: '0 4px 15px rgba(255, 110, 132, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle size={18} style={{ color: '#FF6E84' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{cat.name}</p>
                  <p className="text-sub" style={{ margin: 0, fontSize: '0.8rem' }}>
                    Overspending detected — {formatCur(cat.spent)} this month
                  </p>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <h3 className="section-title">
        <Zap size={18} style={{ color: '#97A9FF' }} /> Monthly Comparison
      </h3>
      <div className="glass-card" style={{ height: 200, overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} barSize={40}>
            <XAxis dataKey="name" tick={{ fill: 'var(--text-sub)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value) => formatCur(value)}
              contentStyle={{ 
                background: 'rgba(28, 32, 40, 0.85)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '12px',
                fontSize: '11px',
                color: 'var(--text-main)',
                padding: '4px 8px'
              }}
              itemStyle={{ color: 'var(--text-main)' }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {comparisonData.map((entry, index) => (
                <Cell key={index} fill={index === 0 ? 'var(--surface-bright)' : 'var(--primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
