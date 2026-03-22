import { useState, useEffect } from 'react'
import axios from 'axios'
import { CheckCircle2, ShieldCheck, Mail, Phone, User, UserCircle } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

export default function Profile() {
    const [profile, setProfile] = useState({ name: '', photo_url: '', phone: '', email: '', is_phone_verified: false, is_email_verified: false })
    const [form, setForm] = useState({ name: '', photo_url: '', phone: '', email: '' })
    const [otpSentTo, setOtpSentTo] = useState(null)
    const [otpType, setOtpType] = useState(null)
    const [otpCode, setOtpCode] = useState("")
    const [mockOtp, setMockOtp] = useState(null)

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/profile/`)
            setProfile(res.data)
            setForm({
                name: res.data.name || '',
                photo_url: res.data.photo_url || '',
                phone: res.data.phone || '',
                email: res.data.email || ''
            })
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleUpdate = async (e) => {
        e.preventDefault()
        try {
            await axios.post(`${API_BASE}/profile/`, form)
            fetchProfile()
            alert("Profile updated!")
        } catch (err) {
            console.error(err)
        }
    }

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            
            if (file.size > 2 * 1024 * 1024) {
                alert("Please upload a picture smaller than 2MB")
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setForm({ ...form, photo_url: reader.result })
            }
            reader.readAsDataURL(file)
        }
    }

    const sendOtp = async (contact, type) => {
        if (!contact) return alert(`Please enter and save a valid ${type} before verifying.`)
        try {
            const res = await axios.post(`${API_BASE}/send-otp/`, { contact, type })
            setOtpSentTo(contact)
            setOtpType(type)
            setMockOtp(res.data.mock_otp)
            alert(`OTP sent to ${contact}!`)
        } catch (err) {
            console.error(err)
        }
    }

    const verifyOtp = async () => {
        if (!otpCode) return
        try {
            await axios.post(`${API_BASE}/verify-otp/`, { contact: otpSentTo, type: otpType, otp: otpCode })
            alert("Verification successful!")
            setOtpSentTo(null)
            setOtpCode("")
            setMockOtp(null)
            fetchProfile()
        } catch (err) {
            alert("Invalid OTP")
            console.error(err)
        }
    }

    return (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <ShieldCheck size={24} color="var(--primary)" /> Profile & Security Settings
            </h2>

            <form onSubmit={handleUpdate} style={{ marginBottom: '2rem' }}>

                {}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    {form.photo_url ? (
                        <img src={form.photo_url} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                    ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCircle size={40} color="var(--text-secondary)" />
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'inline-block', fontSize: '0.875rem', color: 'white', cursor: 'pointer', fontWeight: 600, background: 'var(--primary)', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}>
                            Upload Photo
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label><User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Full Name</label>
                    <input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
                </div>

                <div className="form-group">
                    <label><Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Phone Number</label>
                    <input type="tel" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 99999 00000" />
                </div>

                <div className="form-group">
                    <label><Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Email Address</label>
                    <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
                </div>

                <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
                    Save Contact Info
                </button>
            </form>

            {}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Account Verification</h3>

                <div className="verification-row">
                    <span style={{ fontSize: '0.95rem' }}><strong>Phone:</strong> {profile.phone || 'Not provided'}</span>
                    {profile.is_phone_verified ? (
                        <span className="status-verified"><CheckCircle2 size={18} /> Verified</span>
                    ) : (
                        <button type="button" className="btn-small" onClick={() => sendOtp(profile.phone, 'phone')} disabled={!profile.phone}>
                            Verify Phone
                        </button>
                    )}
                </div>

                <div className="verification-row" style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.95rem' }}><strong>Email:</strong> {profile.email || 'Not provided'}</span>
                    {profile.is_email_verified ? (
                        <span className="status-verified"><CheckCircle2 size={18} /> Verified</span>
                    ) : (
                        <button type="button" className="btn-small" onClick={() => sendOtp(profile.email, 'email')} disabled={!profile.email}>
                            Verify Email
                        </button>
                    )}
                </div>

                {otpSentTo && (
                    <div className="otp-box">
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Enter OTP</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            We've sent a 6-digit code to <strong>{otpSentTo}</strong>.
                            <br /><small style={{ color: 'var(--warning)' }}>(Demo Mode - Active Mock OTP: {mockOtp})</small>
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input type="text" className="input-field" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="000000" maxLength={6} style={{ maxWidth: '120px', letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }} />
                            <button type="button" className="btn" onClick={verifyOtp} style={{ flex: 1 }}>Confirm</button>
                        </div>
                        <button type="button" onClick={() => setOtpSentTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', marginTop: '1rem', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    )
}
