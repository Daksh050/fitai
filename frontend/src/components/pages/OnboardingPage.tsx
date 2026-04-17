import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { API, useAuthStore } from '@/store/authStore'
import { User, Weight, Ruler, Target, Activity, ChevronRight, ChevronLeft, Zap } from 'lucide-react'

const GOALS = [
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪', desc: 'Build lean muscle mass' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '🔥', desc: 'Burn fat, stay fit' },
  { id: 'maintain', label: 'Maintain', icon: '⚖️', desc: 'Stay in shape' },
  { id: 'endurance', label: 'Endurance', icon: '🏃', desc: 'Improve stamina' },
]

const ACTIVITIES = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little movement' },
  { id: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise, standing' },
  { id: 'moderately_active', label: 'Moderate', desc: 'Regular gym or physical job' },
  { id: 'very_active', label: 'Very Active', desc: 'Heavy labor or intense training' },
]

const STEPS = ['Personal Info', 'Body Stats', 'Your Goal', 'Activity Level']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    full_name: '', age: '', weight_kg: '', height_cm: '',
    gender: 'male', goal: 'muscle_gain', activity_level: 'sedentary',
  })

  const set = (k: string, v: string) => setData(d => ({ ...d, [k]: v }))

  const handleFinish = async () => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        age: parseInt(data.age),
        weight_kg: parseFloat(data.weight_kg),
        height_cm: parseFloat(data.height_cm),
      }
      const { data: user } = await API.put('/users/me', payload)
      updateUser(user)
      toast.success('Profile saved! Generating your AI plans...')
      navigate('/')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    // Step 0 - Personal Info
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Full Name</label>
        <input className="input-field" placeholder="Your name" value={data.full_name} onChange={e => set('full_name', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Age</label>
        <input className="input-field" type="number" placeholder="23" min="10" max="100" value={data.age} onChange={e => set('age', e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Gender</label>
        <div className="grid grid-cols-3 gap-3">
          {['male', 'female', 'other'].map(g => (
            <button key={g} type="button" onClick={() => set('gender', g)}
              className="py-3 rounded-xl font-display font-medium text-sm capitalize transition-all duration-200"
              style={data.gender === g ? {
                background: 'rgba(200,255,0,0.15)', color: '#c8ff00',
                border: '1px solid rgba(200,255,0,0.3)',
              } : {
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 1 - Body Stats
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Weight (kg)</label>
        <input className="input-field" type="number" placeholder="72" step="0.1" value={data.weight_kg} onChange={e => set('weight_kg', e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Height (cm)</label>
        <input className="input-field" type="number" placeholder="175" value={data.height_cm} onChange={e => set('height_cm', e.target.value)} required />
      </div>
      {data.weight_kg && data.height_cm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 text-center">
          <p className="text-night-300 text-xs uppercase tracking-widest mb-1">BMI</p>
          <p className="text-3xl font-display font-bold" style={{ color: '#c8ff00' }}>
            {(parseFloat(data.weight_kg) / ((parseFloat(data.height_cm) / 100) ** 2)).toFixed(1)}
          </p>
        </motion.div>
      )}
    </div>,

    // Step 2 - Goal
    <div className="grid grid-cols-2 gap-3">
      {GOALS.map(g => (
        <button key={g.id} type="button" onClick={() => set('goal', g.id)}
          className="p-4 rounded-xl text-left transition-all duration-200"
          style={data.goal === g.id ? {
            background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.35)',
          } : {
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
          <span className="text-2xl block mb-2">{g.icon}</span>
          <p className="font-display font-semibold text-sm" style={data.goal === g.id ? { color: '#c8ff00' } : { color: 'white' }}>{g.label}</p>
          <p className="text-night-400 text-xs mt-0.5 font-body">{g.desc}</p>
        </button>
      ))}
    </div>,

    // Step 3 - Activity
    <div className="space-y-3">
      {ACTIVITIES.map(a => (
        <button key={a.id} type="button" onClick={() => set('activity_level', a.id)}
          className="w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center justify-between"
          style={data.activity_level === a.id ? {
            background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.35)',
          } : {
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
          <div>
            <p className="font-display font-semibold text-sm" style={data.activity_level === a.id ? { color: '#c8ff00' } : { color: 'white' }}>{a.label}</p>
            <p className="text-night-400 text-xs mt-0.5 font-body">{a.desc}</p>
          </div>
          {data.activity_level === a.id && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#c8ff00' }}>
              <div className="w-2 h-2 rounded-full bg-night-900" />
            </div>
          )}
        </button>
      ))}
    </div>,
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #c8ff00 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative">
        {/* Header */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-display font-bold">Set Up Your Profile</h1>
          <p className="text-night-400 mt-2 font-body text-sm">Help us personalize your AI fitness plan</p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1">
              <div className="h-1.5 rounded-full transition-all duration-500"
                style={{ background: i <= step ? '#c8ff00' : 'rgba(255,255,255,0.1)' }} />
              {i === step && (
                <p className="text-xs text-night-300 mt-1.5 font-body truncate">{label}</p>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-xl font-display font-semibold mb-6">{STEPS[step]}</h2>
              {steps[step]}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex items-center gap-2">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-acid flex-1 flex items-center justify-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={loading} className="btn-acid flex-1 flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-night-900 border-t-transparent rounded-full animate-spin" /> : <><Zap size={16} /> Generate My Plans</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
