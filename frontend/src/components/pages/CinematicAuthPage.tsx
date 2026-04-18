import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Brain, Eye, EyeOff, Loader2, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

/* ─── Animated Background ─── */
function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      {/* Glows */}
      <div className="absolute left-[-15%] top-[-10%] h-[600px] w-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 65%)' }} />
      <div className="absolute right-[-10%] top-[30%] h-[500px] w-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)' }} />
      <div className="absolute bottom-[-10%] left-[40%] h-[400px] w-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(191,90,242,0.07) 0%, transparent 65%)' }} />
    </div>
  )
}

export default function CinematicAuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' })
  const { login, register, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        const { user } = useAuthStore.getState()
        toast.success('Welcome back!')
        navigate(user?.is_onboarded ? '/' : '/onboarding', { replace: true })
      } else {
        await register(form)
        toast.success('Account created! Let\'s set up your profile.')
        navigate('/onboarding', { replace: true })
      }
    } catch {
      // error shown via store
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AuthBackground />

      {/* Back to landing */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/landing')}
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm text-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      <div className="relative z-10 grid w-full max-w-5xl gap-12 lg:grid-cols-[1fr_420px]">
        {/* Left panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden flex-col justify-center lg:flex"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', boxShadow: '0 0 20px rgba(0,255,136,0.4)' }}>
              <Zap size={18} className="text-black" />
            </div>
            <span className="text-lg font-bold">FitAI</span>
          </div>

          <h1 className="font-display text-5xl font-black leading-tight">
            Your AI coach,{' '}
            <span className="glow-green">personalised</span>{' '}
            to you.
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            FitAI Brain builds your diet and workout plan from your exact body data — calories, macros, and exercises, all unique to you.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Brain, label: 'AI Brain', sub: 'Gemini-powered engine', color: '#00ff88' },
              { icon: Zap, label: 'Instant Plans', sub: 'Generated in seconds', color: '#00d4ff' },
              { icon: ArrowRight, label: 'Track Progress', sub: 'Live dashboard', color: '#ffd60a' },
            ].map((item) => (
              <div key={item.label} className="neon-card p-4">
                <item.icon size={20} style={{ color: item.color }} />
                <p className="mt-3 font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right panel — Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="neon-card p-8"
        >
          {/* Logo (mobile) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)' }}>
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-bold">FitAI</span>
          </div>

          {/* Mode toggle */}
          <div className="mb-8 flex rounded-xl border border-white/8 bg-white/[0.03] p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300"
                style={
                  mode === m
                    ? { background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#050508', boxShadow: '0 0 20px rgba(0,255,136,0.3)' }
                    : { color: 'rgba(255,255,255,0.5)' }
                }
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="reg-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <input
                    className="input-field"
                    placeholder="Full name"
                    value={form.full_name}
                    onChange={set('full_name')}
                  />
                  <input
                    className="input-field"
                    placeholder="Username"
                    value={form.username}
                    onChange={set('username')}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              className="input-field"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={set('email')}
              required
            />

            <div className="relative">
              <input
                className="input-field pr-12"
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-white"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-neon mt-2 w-full py-3.5"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Brain size={16} />
                  {mode === 'login' ? 'Enter Dashboard' : 'Create & Start Journey'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-neon hover:underline"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
