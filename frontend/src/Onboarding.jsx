import { useState, useRef } from 'react'
import axios from 'axios'
import { UserCircle, Camera, Target, ArrowRight, Sparkles, Check } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Onboarding({ onComplete }) {
    const [step, setStep] = useState(0)
    const [name, setName] = useState('')
    const [photoUrl, setPhotoUrl] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [saving, setSaving] = useState(false)
    const [direction, setDirection] = useState('forward')
    const fileInputRef = useRef(null)

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) return
        const reader = new FileReader()
        reader.onloadend = () => setPhotoUrl(reader.result)
        reader.readAsDataURL(file)
    }

    const goNext = () => {
        setDirection('forward')
        setStep(prev => prev + 1)
    }

    const goBack = () => {
        setDirection('back')
        setStep(prev => prev - 1)
    }

    const handleFinish = async () => {
        setSaving(true)
        try {
            await axios.post(`${API_BASE}/profile/`, {
                name: name.trim(),
                photo_url: photoUrl,
                phone: '',
                email: ''
            })
            if (targetAmount && parseFloat(targetAmount) > 0) {
                await axios.post(`${API_BASE}/budget/`, {
                    target_amount: parseFloat(targetAmount)
                })
            }
            onComplete()
        } catch (err) {
            console.error('Onboarding save failed:', err)
            setSaving(false)
        }
    }

    const stepIndicators = [0, 1, 2]

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-backdrop-orb onboarding-orb-1"></div>
            <div className="onboarding-backdrop-orb onboarding-orb-2"></div>
            <div className="onboarding-backdrop-orb onboarding-orb-3"></div>

            <div className="onboarding-card">
                {/* Step Indicators */}
                <div className="onboarding-steps">
                    {stepIndicators.map(i => (
                        <div key={i} className={`onboarding-step-dot ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`}>
                            {step > i ? <Check size={10} strokeWidth={3} /> : null}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="onboarding-content" key={step}>
                    {step === 0 && (
                        <div className={`onboarding-slide ${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
                            <div className="onboarding-icon-wrap">
                                <Sparkles size={32} color="var(--primary)" />
                            </div>
                            <h2 className="onboarding-title">Welcome to<br />Expense Advisor</h2>
                            <p className="onboarding-subtitle">Let's personalize your experience. What should we call you?</p>
                            <div className="onboarding-input-group">
                                <input
                                    type="text"
                                    className="onboarding-input"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button
                                className="onboarding-btn-primary"
                                onClick={goNext}
                                disabled={!name.trim()}
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className={`onboarding-slide ${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
                            <h2 className="onboarding-title">Add a Photo</h2>
                            <p className="onboarding-subtitle">This helps make the app feel like yours.</p>

                            <div className="onboarding-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
                                <div className="onboarding-avatar-ring">
                                    <div className="onboarding-avatar">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Profile" />
                                        ) : (
                                            <UserCircle size={56} color="var(--text-sub)" />
                                        )}
                                    </div>
                                </div>
                                <div className="onboarding-avatar-badge">
                                    <Camera size={14} />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <p className="onboarding-hint">{photoUrl ? 'Looking great! Tap to change.' : 'Tap the circle to upload'}</p>

                            <div className="onboarding-btn-row">
                                <button className="onboarding-btn-ghost" onClick={goBack}>Back</button>
                                <button className="onboarding-btn-primary" onClick={goNext}>
                                    {photoUrl ? 'Continue' : 'Skip'} <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className={`onboarding-slide ${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
                            <div className="onboarding-icon-wrap">
                                <Target size={32} color="var(--tertiary)" />
                            </div>
                            <h2 className="onboarding-title">Set Monthly Budget</h2>
                            <p className="onboarding-subtitle">We'll help you stay on track. You can always change this later.</p>
                            <div className="onboarding-input-group">
                                <span className="onboarding-input-prefix">₹</span>
                                <input
                                    type="number"
                                    className="onboarding-input onboarding-input-currency"
                                    placeholder="e.g. 30000"
                                    value={targetAmount}
                                    onChange={e => setTargetAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="onboarding-btn-row">
                                <button className="onboarding-btn-ghost" onClick={goBack}>Back</button>
                                <button
                                    className="onboarding-btn-primary onboarding-btn-finish"
                                    onClick={handleFinish}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <span className="onboarding-spinner"></span>
                                    ) : (
                                        <>Get Started <Sparkles size={18} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
