import { useState, useEffect } from 'react'
import axios from 'axios'
import { CheckCircle2, ShieldCheck, Mail, Phone, User, UserCircle, Camera, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

export default function Profile() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState({ name: '', photo_url: '', phone: '', email: '', is_phone_verified: false, is_email_verified: false })
    const [form, setForm] = useState({ name: '', photo_url: '', phone: '', email: '' })
    const [targetAmount, setTargetAmount] = useState('')
    const [otpSentTo, setOtpSentTo] = useState(null)
    const [otpType, setOtpType] = useState(null)
    const [otpCode, setOtpCode] = useState("")
    const [mockOtp, setMockOtp] = useState(null)
    const [toast, setToast] = useState('')

    const showToast = (msg) => {
        setToast(msg)
        setTimeout(() => setToast(''), 3000)
    }

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_BASE}/profile/`)
            setProfile(res.data)
            setForm({
                name: res.data.name || '',
                photo_url: res.data.photo_url || '',
                phone: res.data.phone || '',
                email: res.data.email || ''
            })
            setTargetAmount(res.data.target_amount || '')
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleUpdate = async (e) => {
        e.preventDefault()
        try {
            await axios.post(`${API_BASE}/profile/`, form)
            fetchData()
            showToast("Profile updated!")
        } catch (err) {
            console.error(err)
            showToast("Failed to update profile")
        }
    }

    const handleUpdateTarget = async (e) => {
        e.preventDefault()
        try {
            await axios.post(`${API_BASE}/budget/`, { target_amount: parseFloat(targetAmount) || 0 })
            fetchData()
            showToast("Monthly target updated!")
        } catch (err) {
            console.error(err)
            showToast("Failed to update target")
        }
    }

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) return showToast("File too large (max 2MB)")
            const reader = new FileReader()
            reader.onloadend = () => setForm({ ...form, photo_url: reader.result })
            reader.readAsDataURL(file)
        }
    }

    const sendOtp = async (contact, type) => {
        if (!contact) return showToast(`Please enter and save a valid ${type}`)
        try {
            const res = await axios.post(`${API_BASE}/send-otp/`, { contact, type })
            setOtpSentTo(contact)
            setOtpType(type)
            setMockOtp(res.data.mock_otp)
            showToast(`OTP sent to ${contact}`)
        } catch (err) {
            console.error(err)
            showToast("Failed to send OTP")
        }
    }

    const verifyOtp = async () => {
        if (!otpCode) return
        try {
            await axios.post(`${API_BASE}/verify-otp/`, { contact: otpSentTo, type: otpType, otp: otpCode })
            setOtpSentTo(null)
            setOtpCode("")
            fetchData()
            showToast("Verification successful!")
        } catch (err) {
            showToast("Invalid OTP")
        }
    }

    return (
        <div className="profile-page">
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'var(--surface-high)', border: 'none', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ChevronLeft size={20} />
                </button>
                <h2 style={{ margin: 0 }}>Profile & Security</h2>
            </header>

            <form onSubmit={handleUpdate}>
                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 2.5rem' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-high)', border: '2px solid var(--primary)' }}>
                        {form.photo_url ? (
                            <img src={form.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCircle size={60} color="var(--text-sub)" />
                            </div>
                        )}
                    </div>
                    <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg)' }}>
                        <Camera size={16} />
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                </div>

                <div className="glass-card">
                   <h3 className="headline-md" style={{ fontSize: '1rem', color: 'var(--text-sub)' }}>Personal Information</h3>
                   <div style={{ marginBottom: '1.25rem' }}>
                        <label className="text-sub" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                        <input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
                   </div>
                   <div style={{ marginBottom: '1.25rem' }}>
                        <label className="text-sub" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                        <input type="tel" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 99999 00000" />
                   </div>
                   <div style={{ marginBottom: '1.25rem' }}>
                        <label className="text-sub" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                        <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
                   </div>
                   <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Save Changes</button>
                </div>
            </form>

            <form onSubmit={handleUpdateTarget} className="glass-card" style={{ marginBottom: '2.5rem' }}>
                <h3 className="headline-md" style={{ fontSize: '1rem', color: 'var(--text-sub)' }}>Financial Settings</h3>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label className="text-sub" style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Budget Target (₹)</label>
                    <input type="number" className="input-field" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="e.g. 50000" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Save Target</button>
            </form>

            <div className="glass-card">
                <h3 className="headline-md" style={{ fontSize: '1rem', color: 'var(--text-sub)' }}>Account Verification</h3>
                
                <div className="verification-card-row">
                    <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Phone Verification</p>
                        <p className="text-sub" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>{profile.phone || "Not set"}</p>
                    </div>
                    {profile.is_phone_verified ? (
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}><CheckCircle2 size={18} /> Verified</div>
                    ) : (
                        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => sendOtp(profile.phone, 'phone')} disabled={!profile.phone}>Verify</button>
                    )}
                </div>

                <div className="verification-card-row">
                    <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Email Verification</p>
                        <p className="text-sub" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>{profile.email || "Not set"}</p>
                    </div>
                    {profile.is_email_verified ? (
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}><CheckCircle2 size={18} /> Verified</div>
                    ) : (
                        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => sendOtp(profile.email, 'email')} disabled={!profile.email}>Verify</button>
                    )}
                </div>

                {otpSentTo && (
                    <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--surface-high)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--primary)' }}>
                        <h4 style={{ margin: '0 0 1rem 0' }}>Verification Code</h4>
                        <p className="text-sub" style={{ marginBottom: '1rem' }}>Sent to {otpSentTo}. <br/><span style={{ color: 'var(--primary)' }}>Mock OTP: {mockOtp}</span></p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input type="text" className="input-field" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="000000" maxLength={6} style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '4px' }} />
                            <button className="btn-primary" onClick={verifyOtp}>Confirm</button>
                        </div>
                        <button onClick={() => setOtpSentTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', marginTop: '1rem', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>
                    </div>
                )}
            </div>

            {toast && (
                <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-highest)', color: 'var(--text-main)', padding: '0.75rem 1.5rem', borderRadius: '2rem', zIndex: 3000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    {toast}
                </div>
            )}
        </div>
    )
}
