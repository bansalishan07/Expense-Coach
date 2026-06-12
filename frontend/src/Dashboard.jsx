import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  PlusCircle, 
  TrendingUp, 
  DollarSign, 
  BrainCircuit, 
  Target, 
  AlertTriangle, 
  Wallet, 
  ScanLine, 
  ArrowUpRight, 
  Zap, 
  ChevronRight,
  TrendingDown,
  ShoppingBag,
  Coffee,
  Home,
  Bus,
  Tv,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Html5QrcodeScanner } from 'html5-qrcode'
import './index.css'

const API_BASE = 'http://localhost:8000'

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

export default function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [insights, setInsights] = useState({ total_spent: 0, predicted_next_month: 0, advice: "" })
  const [profile, setProfile] = useState({ target_amount: 0, next_month_deduction: 0 })
  const [activeTab, setActiveTab] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [form, setForm] = useState({ amount: "", category: "", date: "", description: "", is_urgent: false, upiId: "", upiApp: "generic" })
  const [budgetInput, setBudgetInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [showAppPicker, setShowAppPicker] = useState(false)

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false)
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
      const [expRes, insRes, profRes] = await Promise.all([
        axios.get(`${API_BASE}/expenses/`),
        axios.get(`${API_BASE}/insights/`),
        axios.get(`${API_BASE}/profile/`)
      ])
      setExpenses(expRes.data)
      setInsights(insRes.data)
      setProfile(profRes.data)
      setBudgetInput(profRes.data.target_amount || "")
    } catch (err) {
      console.error("Failed to fetch data", err)
    }
  }

  useEffect(() => { fetchData() }, [])

  const effectiveBudget = (profile.target_amount || 0) - (profile.next_month_deduction || 0)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthSpent = expenses.reduce((acc, e) => e.date.startsWith(currentMonth) ? acc + e.amount : acc, 0)
  const remainingBudget = Math.max(0, effectiveBudget - thisMonthSpent)

  const today = new Date()
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysLeft = lastDayOfMonth.getDate() - today.getDate()
  
  const dailyAverageScore = thisMonthSpent / Math.max(1, today.getDate())
  const projectedSpent = dailyAverageScore * lastDayOfMonth.getDate()
  const estimatedSavings = effectiveBudget > 0 ? Math.max(0, effectiveBudget - projectedSpent) : 0

  const submitManual = async (isUrgent) => {
    try {
      await axios.post(`${API_BASE}/expenses/`, {
        amount: parseFloat(form.amount),
        category: "",
        date: new Date().toISOString().split('T')[0],
        description: form.description,
        is_urgent: isUrgent
      })
      setForm({ amount: "", category: "", date: "", description: "", is_urgent: false, upiId: "", upiApp: "generic" })
      setActiveTab('')
      fetchData()
      setToast("Expense saved successfully!")
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast(err.response?.data?.detail || "Failed to add expense")
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.description) return
    const parsedAmount = parseFloat(form.amount)
    if (profile.target_amount > 0 && (thisMonthSpent + parsedAmount > effectiveBudget)) {
      setConfirmDialog({
        message: "You've exceeded your monthly budget. Deduct the overage from NEXT month's budget?",
        onConfirm: () => {
          setConfirmDialog(null)
          submitManual(true)
        },
        onCancel: () => setConfirmDialog(null)
      })
      return
    }
    submitManual(false)
  }

  const paymentApps = [
    { key: 'gpay', name: 'Google Pay', scheme: 'tez://upi/pay', color: '#4285F4', icon: '₹' },
    { key: 'phonepe', name: 'PhonePe', scheme: 'phonepe://pay', color: '#5F259F', icon: '₱' },
    { key: 'paytm', name: 'Paytm', scheme: 'paytmmp://upi/pay', color: '#00BAF2', icon: '₽' },
    { key: 'bhim', name: 'BHIM UPI', scheme: 'upi://pay', color: '#00897B', icon: '₿' },
    { key: 'amazonpay', name: 'Amazon Pay', scheme: 'amazonpay://pay', color: '#FF9900', icon: '₳' },
    { key: 'cred', name: 'CRED', scheme: 'credpay://upi/pay', color: '#FFFFFF', icon: '©' },
  ]

  const handleAppSelect = (appKey) => {
    const selectedApp = paymentApps.find(a => a.key === appKey) || paymentApps[3]
    const params = []
    if (form.upiId) params.push(`pa=${form.upiId}`)
    if (form.amount) params.push(`am=${parseFloat(form.amount)}`)
    params.push(`cu=INR`)
    if (form.description) params.push(`tn=${encodeURIComponent(form.description)}`)
    params.push(`pn=${encodeURIComponent('Expense Coach Payment')}`)
    const queryString = params.length > 0 ? `?${params.join('&')}` : ''
    
    const url = `${selectedApp.scheme}${queryString}`
    const link = document.createElement('a')
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCur = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  const chartData = [...expenses].reverse().map(e => ({
    date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: e.amount
  }))

  const categoryColors = ['#4C51BF', '#EA73FB', '#B8FFBB', '#FFD93D', '#6C63FF', '#FF716C', '#4ECDC4', '#F093FB']
  const categories = (() => {
    const grouped = {}
    expenses.forEach(e => {
      const cat = e.category || 'Uncategorized'
      grouped[cat] = (grouped[cat] || 0) + e.amount
    })
    return Object.entries(grouped)
      .map(([name, spent], i) => ({ name, spent, color: categoryColors[i % categoryColors.length] }))
      .sort((a, b) => b.spent - a.spent)
  })()

  return (
    <div className="dashboard-layout">
      <section className="balance-section">
        <p className="balance-label">Total Available Balance</p>
        <h2 className="display-lg">{formatCur(remainingBudget)}</h2>
        <div className="action-row">
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => setActiveTab('manual')}>
            <ArrowUpRight size={20} /> Add Expense
          </button>
          <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setShowAppPicker(true)}>
            <Zap size={20} color="var(--primary)" /> Quick Pay
          </button>
        </div>
      </section>

      <div className="dashboard-grid">
        <div>
          <div className="glass-card">
            <h3 className="headline-md">Monthly Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-sub">Planned Spending</span>
              <span style={{ fontWeight: 700 }}>
                {effectiveBudget > 0 ? `${formatCur(thisMonthSpent)} / ${formatCur(effectiveBudget)}` : formatCur(thisMonthSpent)}
              </span>
            </div>
            <div style={{ height: '8px', background: 'var(--surface-highest)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${effectiveBudget > 0 && thisMonthSpent > 0 ? Math.min(100, (thisMonthSpent/effectiveBudget)*100) : 0}%`, height: '100%', background: 'var(--primary-gradient)' }}></div>
            </div>
            <p className="text-sub" style={{ marginTop: '1rem' }}>
              {effectiveBudget > 0 
                ? (remainingBudget > 0 ? `You have ${formatCur(remainingBudget)} left for ${daysLeft} days.` : "You've reached your budget limit.")
                : "Set a monthly target in your Profile to track progress."}
            </p>
          </div>

          {effectiveBudget > 0 && (
            <div className="card" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                 <div>
                   <h3 style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>Estimated Monthly Savings</h3>
                   <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0 0' }}>{formatCur(estimatedSavings)}</p>
                 </div>
                 <TrendingUp size={28} style={{ opacity: 0.9 }} />
              </div>
              <p style={{ marginTop: '1rem', opacity: 0.9, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Averaging <strong>{formatCur(dailyAverageScore)}</strong> per day, you'll likely have this much left from your budget by month's end.
              </p>
            </div>
          )}

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles size={20} color="var(--primary)" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
              <h3 style={{ margin: 0 }}>Financial Coach</h3>
            </div>
            <p className="text-sub" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {insights.advice || "Analyzing your spending patterns to provide personalized advice..."}
            </p>
          </div>

          <div className="glass-card" style={{ height: '280px' }}>
            <h3 className="headline-md">Spending Trends</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" horizontal={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: 'var(--surface-high)', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--primary)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
                <p className="text-sub">No data yet</p>
            )}
          </div>
        </div>

        <div>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Top Categories</h3>
              <span className="text-sub" style={{ fontSize: '0.75rem' }}>{categories.length} categories</span>
            </div>
            {categories.length === 0 && <p className="text-sub">No expenses yet. Add some to see your top categories.</p>}
            {categories.slice(0, 5).map(cat => {
              const maxSpent = categories.length > 0 ? categories[0].spent : 1
              return (
                <div key={cat.name} className="category-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="category-icon" style={{ background: `${cat.color}22`, color: cat.color }}>
                        {getCategoryIcon(cat.name)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCur(cat.spent)}</span>
                  </div>
                  <div className="category-bar-track">
                    <div className="category-bar-fill" style={{ width: `${(cat.spent / maxSpent) * 100}%`, background: cat.color }}></div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="glass-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Recent Activity</h3>
              <TrendingDown size={20} className="text-sub" />
            </div>
            <div className="transaction-list">
              {expenses.slice(0, 8).map(e => (
                <div key={e.id} className="transaction-item" style={{ background: 'transparent', padding: '0.75rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="icon-box">
                      {getCategoryIcon(e.category)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, margin: 0 }}>{e.description}</p>
                      <p className="text-sub" style={{ margin: 0 }}>{e.category} • {new Date(e.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--error)' }}>- {formatCur(e.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'manual' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Add Expense</h2>
              <button onClick={() => setActiveTab('')} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="text-sub" style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (₹)</label>
                <input type="number" step="1" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="text-sub" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <input type="text" className="input-field" placeholder="What's this for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Expense</button>
            </form>
          </div>
        </div>
      )}

      {showAppPicker && (
        <div className="modal-overlay" style={{ zIndex: 3500 }}>
          <div className="modal-content" style={{ maxWidth: '380px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Quick Pay</h3>
              <button onClick={() => { setShowAppPicker(false); setIsScanning(false) }} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem' }}>UPI ID (optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" className="input-field" placeholder="name@upi" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} style={{ flex: 1 }} />
                <button type="button" className="btn-secondary" style={{ padding: '0 0.75rem' }} onClick={() => setIsScanning(!isScanning)}>
                  <ScanLine size={20} />
                </button>
              </div>
              {isScanning && <div id="qr-reader" style={{ marginTop: '0.75rem', borderRadius: '12px', overflow: 'hidden' }}></div>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="text-sub" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem' }}>Amount (₹)</label>
                <input type="number" step="1" className="input-field" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-sub" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem' }}>Note</label>
                <input type="text" className="input-field" placeholder="For..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <p className="text-sub" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>Select a payment app</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {paymentApps.map(app => (
                <button
                  key={app.key}
                  onClick={() => handleAppSelect(app.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', padding: '1rem 0.5rem', borderRadius: '16px',
                    background: 'var(--surface-high)', border: '1px solid var(--outline)',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = app.color; e.currentTarget.style.transform = 'scale(1.05)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--outline)'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `${app.color}20`, color: app.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 800
                  }}>
                    {app.icon}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-highest)', color: 'var(--text-main)', padding: '0.75rem 1.5rem', borderRadius: '2rem', zIndex: 3000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
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
