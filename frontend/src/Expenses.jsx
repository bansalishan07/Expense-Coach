import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Filter,
  Coffee,
  ShoppingBag,
  Home,
  Bus,
  Tv,
  HelpCircle,
  ScanLine,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Html5QrcodeScanner } from 'html5-qrcode'
import './index.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Food & Dining': return <Coffee size={18} />;
    case 'Shopping': return <ShoppingBag size={18} />;
    case 'Housing & Utilities': return <Home size={18} />;
    case 'Transportation': return <Bus size={18} />;
    case 'Entertainment': return <Tv size={18} />;
    default: return <HelpCircle size={18} />;
  }
}

const categoryColors = ['#97A9FF', '#EA73FB', '#7BE0D3', '#FFD93D', '#6C63FF', '#FF716C', '#4ECDC4', '#F093FB']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [filterCategory, setFilterCategory] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', is_urgent: false, upiId: '', upiApp: 'generic' })
  const [isScanning, setIsScanning] = useState(false)
  const [profile, setProfile] = useState({ target_amount: 0, next_month_deduction: 0 })
  const [toast, setToast] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner('qr-reader-exp', { fps: 10, qrbox: { width: 250, height: 250 } }, false)
      const onScanSuccess = (decodedText) => {
        scanner.clear()
        setIsScanning(false)
        try {
          const url = new URL(decodedText)
          if (url.protocol.startsWith('upi')) {
            const pa = url.searchParams.get('pa')
            const am = url.searchParams.get('am')
            setForm(prev => ({ ...prev, upiId: pa || prev.upiId, amount: am || prev.amount }))
          } else if (decodedText.includes('@')) {
            setForm(prev => ({ ...prev, upiId: decodedText }))
          }
        } catch (e) {
          if (decodedText.includes('@')) setForm(prev => ({ ...prev, upiId: decodedText }))
        }
      }
      scanner.render(onScanSuccess, console.warn)
      return () => scanner.clear().catch(e => console.error("Failed to clear scanner", e))
    }
  }, [isScanning])

  const fetchData = async () => {
    try {
      const [expRes, profRes] = await Promise.all([
        axios.get(`${API_BASE}/expenses/`),
        axios.get(`${API_BASE}/profile/`)
      ])
      setExpenses(expRes.data)
      setProfile(profRes.data)
    } catch (err) {
      console.error("Failed to fetch data", err)
    }
  }

  useEffect(() => { fetchData() }, [])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth))
  const lastMonthExpenses = expenses.filter(e => e.date.startsWith(lastMonth))
  const thisMonthSpent = thisMonthExpenses.reduce((acc, e) => acc + e.amount, 0)
  const lastMonthSpent = lastMonthExpenses.reduce((acc, e) => acc + e.amount, 0)
  const changePercent = lastMonthSpent > 0 ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent * 100).toFixed(1) : 0
  const effectiveBudget = (profile.target_amount || 0) - (profile.next_month_deduction || 0)

  const allCategories = [...new Set(expenses.map(e => e.category || 'Uncategorized'))]
  const filteredExpenses = filterCategory === 'All'
    ? expenses
    : expenses.filter(e => (e.category || 'Uncategorized') === filterCategory)

  const categoryData = (() => {
    const grouped = {}
    thisMonthExpenses.forEach(e => {
      const cat = e.category || 'Uncategorized'
      grouped[cat] = (grouped[cat] || 0) + e.amount
    })
    return Object.entries(grouped).map(([name, value], i) => ({
      name, value, color: categoryColors[i % categoryColors.length]
    }))
  })()

  const formatCur = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  const submitExpense = async (isUrgent) => {
    try {
      await axios.post(`${API_BASE}/expenses/`, {
        amount: parseFloat(form.amount),
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: form.description,
        is_urgent: isUrgent
      })
      setForm({ amount: '', description: '', is_urgent: false, upiId: '', upiApp: 'generic' })
      setShowAddModal(false)
      fetchData()
      setToast('Expense saved successfully!')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast(err.response?.data?.detail || 'Failed to add expense')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.description) return
    const parsedAmount = parseFloat(form.amount)
    if (profile.target_amount > 0 && (thisMonthSpent + parsedAmount > effectiveBudget)) {
      setConfirmDialog({
        message: "You've exceeded your monthly budget. Deduct the overage from NEXT month's budget?",
        onConfirm: () => {
          setConfirmDialog(null)
          submitExpense(true)
        },
        onCancel: () => setConfirmDialog(null)
      })
      return
    }
    submitExpense(false)
  }

  return (
    <div className="page-layout">
      <header className="page-header">
        <div>
          <h2 className="page-title">My Expenses</h2>
          <p className="text-sub">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button className="icon-button" title="Filter">
          <Filter size={20} />
        </button>
      </header>

      <div className="summary-card-glass balance-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, position: 'relative' }}>
          <div>
            <p className="text-sub" style={{ marginBottom: '0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Total Spent This Month</p>
            <h2 className="display-lg" style={{ fontSize: '2.25rem', background: 'var(--primary-gradient-vivid)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0.25rem 0' }}>{formatCur(thisMonthSpent)}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
              {Number(changePercent) <= 0 ? (
                <TrendingDown size={16} style={{ color: '#7BE0D3' }} />
              ) : (
                <TrendingUp size={16} style={{ color: '#FF716C' }} />
              )}
              <span style={{ color: Number(changePercent) <= 0 ? '#7BE0D3' : '#FF716C', fontSize: '0.85rem', fontWeight: 600 }}>
                {Math.abs(changePercent)}% vs last month
              </span>
            </div>
          </div>
          {categoryData.length > 0 && (
            <div style={{ width: 100, height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                  <Pie data={categoryData} innerRadius={28} outerRadius={42} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="filter-chips">
        <button
          className={`chip ${filterCategory === 'All' ? 'chip-active' : ''}`}
          onClick={() => setFilterCategory('All')}
        >All</button>
        {allCategories.map(cat => (
          <button
            key={cat}
            className={`chip ${filterCategory === cat ? 'chip-active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className="expense-list">
        {filteredExpenses.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} style={{ color: 'var(--text-sub)', marginBottom: '1rem', animation: 'pulseGlow 3s ease-in-out infinite' }} />
            <p className="text-sub">No expenses found. Tap + to add one.</p>
          </div>
        )}
        {filteredExpenses.map(e => (
          <div key={e.id} className="expense-item">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="category-icon-circle" style={{ background: `${categoryColors[allCategories.indexOf(e.category || 'Uncategorized') % categoryColors.length]}22`, color: categoryColors[allCategories.indexOf(e.category || 'Uncategorized') % categoryColors.length] }}>
                {getCategoryIcon(e.category)}
              </div>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{e.description}</p>
                <p className="text-sub" style={{ margin: 0, fontSize: '0.75rem' }}>{e.category} · {new Date(e.date).toLocaleDateString()}</p>
              </div>
            </div>
            <p style={{ fontWeight: 700, color: '#FF6E84', margin: 0 }}>- {formatCur(e.amount)}</p>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg, #4C51BF, #667EEA, #EA73FB)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <PlusCircle size={28} />
      </button>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Add Expense</h2>
              <button onClick={() => setShowAddModal(false)} className="close-btn">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" step="1" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="input-field" placeholder="What's this for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'var(--glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: 'var(--text-main)', padding: '0.85rem 1.75rem', borderRadius: '2rem', zIndex: 3000, boxShadow: '0 8px 25px rgba(0,0,0,0.4)', border: '1px solid var(--ghost-border)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {confirmDialog && (
         <div className="modal-overlay" style={{ zIndex: 4000 }}>
            <div className="modal-content" style={{ textAlign: 'center', maxWidth: '320px', padding: '2rem 1.5rem' }}>
                <AlertTriangle size={48} color="var(--error)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>Budget Exceeded</h3>
                <p className="text-sub" style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {confirmDialog.message}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                   <button className="btn-secondary" style={{ flex: 1 }} onClick={confirmDialog.onCancel}>Cancel</button>
                   <button className="btn-primary" style={{ flex: 1, background: 'var(--error)', color: 'white' }} onClick={confirmDialog.onConfirm}>Yes, Deduct</button>
                </div>
            </div>
         </div>
      )}
    </div>
  )
}
