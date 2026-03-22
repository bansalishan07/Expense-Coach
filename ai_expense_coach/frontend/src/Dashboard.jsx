import { useState, useEffect } from 'react'
import axios from 'axios'
import { PlusCircle, TrendingUp, DollarSign, BrainCircuit, Target, AlertTriangle, Wallet, ScanLine } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Html5QrcodeScanner } from 'html5-qrcode'
import './index.css'

const API_BASE = 'http://localhost:8000'

export default function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [insights, setInsights] = useState({ total_spent: 0, predicted_next_month: 0, advice: "" })
  const [profile, setProfile] = useState({ target_amount: 0, next_month_deduction: 0 })
  const [activeTab, setActiveTab] = useState('manual')
  const [filterCategory, setFilterCategory] = useState('All')
  const [form, setForm] = useState({ amount: "", category: "", date: "", description: "", is_urgent: false, upiId: "", upiApp: "generic" })
  const [budgetInput, setBudgetInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)

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

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e))
      }
    }
  }, [isScanning])

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/expenses/`)
      setExpenses(res.data)
    } catch (err) {
      console.error("Failed to fetch expenses", err)
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await axios.get(`${API_BASE}/insights/`)
      setInsights(res.data)
    } catch (err) {
      console.error("Failed to fetch insights", err)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/profile/`)
      setProfile(res.data)
      setBudgetInput(res.data.target_amount || "")
    } catch (err) {
      console.error("Failed to fetch profile", err)
    }
  }

  useEffect(() => {
    fetchExpenses()
    fetchInsights()
    fetchProfile()
  }, [])

  const effectiveBudget = (profile.target_amount || 0) - (profile.next_month_deduction || 0)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthSpent = expenses.reduce((acc, e) => e.date.startsWith(currentMonth) ? acc + e.amount : acc, 0)
  const remainingBudget = Math.max(0, effectiveBudget - thisMonthSpent)

  const today = new Date()
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysLeft = lastDayOfMonth.getDate() - today.getDate()
  const safeToSpendPerDay = daysLeft > 0 ? remainingBudget / daysLeft : remainingBudget

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.description) return

    try {
      await axios.post(`${API_BASE}/expenses/`, {
        amount: parseFloat(form.amount),
        category: "",
        date: new Date().toISOString().split('T')[0],
        description: form.description,
        is_urgent: form.is_urgent
      })
      setForm({ amount: "", category: "", date: "", description: "", is_urgent: false, upiId: "", upiApp: "generic" })
      fetchExpenses()
      fetchInsights()
      fetchProfile()
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        alert(err.response.data.detail)
      } else {
        console.error("Failed to add expense", err)
      }
    }
  }

  const handleUpiSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.description || !form.upiId) return
    const parsedAmount = parseFloat(form.amount)
    let urgentFlag = false

    if (profile.target_amount > 0 && (thisMonthSpent + parsedAmount > effectiveBudget)) {
      const consent = window.confirm(`⚠️ BUDGET LIMIT EXCEEDED!\n\nThis payment of ₹${parsedAmount} exceeds your remaining budget of ₹${remainingBudget.toFixed(2)}.\n\nDo you want to process this payment as URGENT and deduct the overage from NEXT month's budget?`)
      if (!consent) return
      urgentFlag = true
    }

    try {
      await axios.post(`${API_BASE}/expenses/`, {
        amount: parsedAmount,
        category: "",
        date: new Date().toISOString().split('T')[0], // Default to today
        description: `UPI to ${form.upiId}: ${form.description}`,
        is_urgent: urgentFlag
      })

      alert("Expense logged automatically. Attempting to open UPI app to complete payment...")

      const params = `pa=${form.upiId}&pn=${encodeURIComponent("Expense Coach Payment")}&am=${parsedAmount}&cu=INR&tn=${encodeURIComponent(form.description)}`
      let upiLink = `upi://pay?${params}`
      if (form.upiApp === 'gpay') upiLink = `tez://upi/pay?${params}`
      else if (form.upiApp === 'phonepe') upiLink = `phonepe://pay?${params}`
      else if (form.upiApp === 'paytm') upiLink = `paytmmp://pay?${params}`
      else if (form.upiApp === 'bhim') upiLink = `bhim://pay?${params}`

      window.location.href = upiLink // Will trigger app on mobile

      setForm({ amount: "", category: "", date: "", description: "", is_urgent: false, upiId: "", upiApp: "generic" })
      fetchExpenses()
      fetchInsights()
      fetchProfile()
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        alert(err.response.data.detail)
      } else {
        console.error("Failed to add expense", err)
      }
    }
  }

  const handleUpdateBudget = async () => {
    try {
      await axios.post(`${API_BASE}/budget/`, { target_amount: parseFloat(budgetInput) || 0 })
      alert("Budget target updated!")
      fetchProfile()
    } catch (err) {
      console.error("Failed to update budget", err)
    }
  }

  const formatCur = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)

  const filteredExpenses = filterCategory === 'All' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory)

  const chartData = [...expenses].reverse().map(e => ({
    date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: e.amount
  }))

  return (
    <div className="dashboard-grid">
      {/* Left Column: Form & Recent */}
      <div className="glass-card">
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn"
            style={{ flex: 1, background: activeTab === 'manual' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.05)', color: activeTab === 'manual' ? 'white' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('manual')}>
            <PlusCircle size={18} /> Manual Expense
          </button>
          <button
            type="button"
            className="btn"
            style={{ flex: 1, background: activeTab === 'upi' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.05)', color: activeTab === 'upi' ? 'white' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('upi')}>
            <Wallet size={18} /> Make UPI Payment
          </button>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" step="0.01" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" className="input-field" placeholder="E.g., Dinner at Mario's" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <input type="checkbox" id="urgentCheck" checked={form.is_urgent} onChange={e => setForm({ ...form, is_urgent: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="urgentCheck" style={{ margin: 0, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={16} color="var(--error)" />
                Urgent (Deduct any amount over budget from next month)
              </label>
            </div>
            <button type="submit" className="btn" style={{ marginTop: '1.5rem', width: '100%' }}>Save Expense</button>
          </form>
        ) : (
          <form onSubmit={handleUpiSubmit}>
            <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>Payee UPI ID</label>
                <input type="text" className="input-field" placeholder="merchantname@upi" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} required />
              </div>
              <button type="button" className="btn-small" onClick={() => setIsScanning(!isScanning)} style={{ height: '42px', padding: '0 1rem', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ScanLine size={18} />
                {isScanning ? 'Cancel' : 'Scan QR'}
              </button>
            </div>
            {isScanning && (
              <div id="qr-reader" style={{ width: '100%', marginBottom: '1rem', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--surface)' }}></div>
            )}
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" step="0.01" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Note / Description</label>
              <input type="text" className="input-field" placeholder="E.g., Dinner share" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Payment App</label>
              <select className="input-field" value={form.upiApp} onChange={e => setForm({ ...form, upiApp: e.target.value })}>
                <option value="generic">Any UPI App (Default)</option>
                <option value="gpay">Google Pay (GPay)</option>
                <option value="phonepe">PhonePe</option>
                <option value="paytm">Paytm</option>
                <option value="bhim">BHIM UPI</option>
              </select>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
              Submitting will automatically log the expense into your coach and redirect you to your preferred UPI payment app to complete the transaction.
            </p>
            <button type="submit" className="btn" style={{ marginTop: '1rem', width: '100%', background: 'var(--success)' }}>
              Pay Now & Log Expense
            </button>
          </form>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}><DollarSign size={20} /> Recent Expenses</h2>
          <select 
            className="input-field" 
            style={{ width: 'auto', margin: 0, padding: '0.4rem 0.8rem', minWidth: '150px' }}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Shopping">Shopping</option>
            <option value="Housing & Utilities">Housing & Utilities</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <ul className="expense-list">
          {filteredExpenses.map(e => (
            <li key={e.id} className="expense-item">
              <div className="expense-info">
                <div className="category">{e.category}</div>
                <div className="date">{e.description} - {e.date}</div>
              </div>
              <div className="expense-amount">
                {formatCur(e.amount)}
              </div>
            </li>
          ))}
          {filteredExpenses.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>
              {expenses.length === 0 ? "No expenses recorded yet." : "No expenses match this category filter."}
            </p>
          )}
        </ul>
      </div>

      {/* Right Column: AI Insights & Charts */}
      <div>
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2><Target size={20} /> Budget & Targets</h2>
          <div style={{ display: 'flex', alignItems: 'end', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Monthly Target Budget (₹)</label>
              <input type="number" className="input-field" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} placeholder="E.g. 50000" />
            </div>
            <button className="btn-small" onClick={handleUpdateBudget} style={{ height: '42px', padding: '0 1.5rem', background: 'rgba(255,255,255,0.1)' }}>Set</button>
          </div>

          {profile.target_amount > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', border: '1px solid var(--surface-border)' }}>
              <div>
                <small style={{ color: 'var(--text-secondary)' }}>Remaining This Month</small>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: remainingBudget > 0 ? 'var(--success)' : 'var(--error)' }}>
                  {formatCur(remainingBudget)}
                </div>
              </div>
              {profile.next_month_deduction > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <small style={{ color: 'var(--error)' }}>Next Month Debt</small>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--error)' }}>
                    - {formatCur(profile.next_month_deduction)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2><BrainCircuit size={20} /> AI Financial Insights</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="insight-metric" style={{ flex: 1 }}>
              <div className="label">Total Spent</div>
              <div className="value">{formatCur(insights.total_spent)}</div>
            </div>
            <div className="insight-metric" style={{ flex: 1 }}>
              <div className="label">Days Left</div>
              <div className="value highlight">{daysLeft}</div>
            </div>
            <div className="insight-metric" style={{ flex: 1 }}>
              <div className="label">Remaining This Month</div>
              <div className="value" style={{ color: remainingBudget > 0 ? 'var(--success)' : 'var(--error)' }}>{formatCur(remainingBudget)}</div>
            </div>
          </div>
          <div className="advice-box">
            <strong>Personalized Advice:</strong> <br />
            {insights.advice}
          </div>
        </div>

        <div className="glass-card" style={{ height: '350px' }}>
          <h2><TrendingUp size={20} /> Spending Trends</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem' }}>
              Add some expenses to see your trends!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
