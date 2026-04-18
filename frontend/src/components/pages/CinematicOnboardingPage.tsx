import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { API, useAuthStore } from '@/store/authStore'

const GOALS = [
  { id: 'muscle_gain', label: 'Muscle Gain', desc: 'Lean mass and strength' },
  { id: 'weight_loss', label: 'Weight Loss', desc: 'Fat loss and energy control' },
  { id: 'maintain', label: 'Maintain', desc: 'Balanced performance' },
  { id: 'endurance', label: 'Endurance', desc: 'Better stamina and capacity' },
]

const ACTIVITIES = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Mostly desk-based work' },
  { id: 'lightly_active', label: 'Lightly Active', desc: 'Light activity through the day' },
  { id: 'moderately_active', label: 'Moderately Active', desc: 'Regular exercise or movement' },
  { id: 'very_active', label: 'Very Active', desc: 'High workload or intense training' },
]

const DIETS = [
  { id: 'veg', label: 'Vegetarian', desc: 'Plant-based, includes dairy' },
  { id: 'non_veg', label: 'Non-Vegetarian', desc: 'Includes meat and animal products' },
  { id: 'vegan', label: 'Vegan', desc: 'Strictly no animal products' },
]

const STEPS = ['Identity', 'Body Metrics', 'Primary Goal', 'Daily Activity', 'Diet Preference']

export default function CinematicOnboardingPage() {
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    full_name: '',
    age: '',
    weight_kg: '',
    height_cm: '',
    gender: 'male',
    goal: 'muscle_gain',
    activity_level: 'sedentary',
    dietary_preference: 'non_veg',
  })

  const setValue = (key: string, value: string) => setData((current) => ({ ...current, [key]: value }))

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
      toast.success('Profile saved')
      navigate('/')
    } catch {
      toast.error('Could not save your profile')
    } finally {
      setLoading(false)
    }
  }

  const bmi = data.weight_kg && data.height_cm
    ? (parseFloat(data.weight_kg) / ((parseFloat(data.height_cm) / 100) ** 2)).toFixed(1)
    : null

  const panels = [
    <div className="grid gap-4 sm:grid-cols-2">
      <input className="input-field sm:col-span-2" placeholder="Full name" value={data.full_name} onChange={(e) => setValue('full_name', e.target.value)} />
      <input className="input-field" type="number" placeholder="Age" min="10" max="100" value={data.age} onChange={(e) => setValue('age', e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        {['male', 'female', 'other'].map((gender) => (
          <button key={gender} type="button" onClick={() => setValue('gender', gender)} className="rounded-2xl border px-3 py-3 text-sm font-display capitalize transition-all duration-300" style={data.gender === gender ? { background: 'rgba(246,195,91,0.14)', borderColor: 'rgba(246,195,91,0.35)', color: '#f6c35b' } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}>
            {gender}
          </button>
        ))}
      </div>
    </div>,
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="input-field" type="number" placeholder="Weight (kg)" value={data.weight_kg} onChange={(e) => setValue('weight_kg', e.target.value)} />
        <input className="input-field" type="number" placeholder="Height (cm)" value={data.height_cm} onChange={(e) => setValue('height_cm', e.target.value)} />
      </div>
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <p className="page-kicker">Live Estimate</p>
        <p className="mt-2 font-display text-4xl font-semibold text-acid">{bmi || '--'}</p>
        <p className="mt-2 text-sm text-white/55">Body mass index appears here as soon as height and weight are entered.</p>
      </div>
    </div>,
    <div className="grid gap-3 sm:grid-cols-2">
      {GOALS.map((goal) => (
        <button key={goal.id} type="button" onClick={() => setValue('goal', goal.id)} className="rounded-[24px] border p-5 text-left transition-all duration-300" style={data.goal === goal.id ? { background: 'rgba(246,195,91,0.12)', borderColor: 'rgba(246,195,91,0.34)' } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="font-display text-lg font-semibold" style={data.goal === goal.id ? { color: '#f6c35b' } : { color: 'white' }}>{goal.label}</p>
          <p className="mt-2 text-sm text-white/55">{goal.desc}</p>
        </button>
      ))}
    </div>,
    <div className="space-y-3">
      {ACTIVITIES.map((activity) => (
        <button key={activity.id} type="button" onClick={() => setValue('activity_level', activity.id)} className="flex w-full items-center justify-between rounded-[24px] border p-4 text-left transition-all duration-300" style={data.activity_level === activity.id ? { background: 'rgba(246,195,91,0.12)', borderColor: 'rgba(246,195,91,0.34)' } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <p className="font-display text-base font-semibold" style={data.activity_level === activity.id ? { color: '#f6c35b' } : { color: 'white' }}>{activity.label}</p>
            <p className="mt-1 text-sm text-white/55">{activity.desc}</p>
          </div>
          <div className="h-4 w-4 rounded-full border border-white/20" style={data.activity_level === activity.id ? { background: '#f6c35b', borderColor: '#f6c35b' } : {}} />
        </button>
      ))}
    </div>,
    <div className="grid gap-3 sm:grid-cols-1">
      {DIETS.map((diet) => (
        <button key={diet.id} type="button" onClick={() => setValue('dietary_preference', diet.id)} className="flex w-full items-center justify-between rounded-[24px] border p-4 text-left transition-all duration-300" style={data.dietary_preference === diet.id ? { background: 'rgba(0,255,136,0.12)', borderColor: 'rgba(0,255,136,0.34)' } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <p className="font-display text-base font-semibold" style={data.dietary_preference === diet.id ? { color: '#00ff88' } : { color: 'white' }}>{diet.label}</p>
            <p className="mt-1 text-sm text-white/55">{diet.desc}</p>
          </div>
          <div className="h-4 w-4 rounded-full border border-white/20" style={data.dietary_preference === diet.id ? { background: '#00ff88', borderColor: '#00ff88' } : {}} />
        </button>
      ))}
    </div>,
  ]

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="ambient-orb gold left-[-8rem] top-8 h-72 w-72" />
      <div className="ambient-orb ember right-[-6rem] bottom-8 h-72 w-72" />

      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="hero-panel">
          <p className="page-kicker">Profile Calibration</p>
          <h1 className="mt-4 font-display text-4xl font-semibold">Tune the AI brain to your body, goal, and routine.</h1>
          <p className="mt-4 text-base text-muted">A cleaner intake flow with touch-friendly controls, compact cards, and strong contrast for mobile screens.</p>

          <div className="mt-8 grid gap-3">
            {STEPS.map((label, index) => (
              <div key={label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-sm">{label}</span>
                  <span className="text-xs text-white/45">0{index + 1}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-acid via-acid-light to-plasma transition-all duration-500" style={{ width: `${index <= step ? 100 : 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8">
          <p className="page-kicker">Step {step + 1}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">{STEPS[step]}</h2>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                {panels[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {step > 0 && (
              <button onClick={() => setStep((current) => current - 1)} className="btn-ghost">
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep((current) => current + 1)} className="btn-acid sm:ml-auto">
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={loading} className="btn-acid sm:ml-auto">
                {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-night-950 border-t-transparent" /> : <Sparkles size={16} />}
                Generate My Plans
              </button>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
