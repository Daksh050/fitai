import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Zap, Eye, EyeOff, ArrowRight, Dumbbell } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' })
  const { login, register, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        await register(form)
        toast.success('Account created!')
      }
      navigate('/onboarding')
    } catch {
      // error shown from store
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #c8ff00 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ff3cac 0%, transparent 70%)' }} />

      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-glow-pulse"
            style={{ background: 'rgba(200,255,0,0.15)', border: '1px solid rgba(200,255,0,0.3)' }}>
            <Dumbbell size={32} style={{ color: '#c8ff00' }} />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Fit<span style={{ color: '#c8ff00' }}>AI</span>
          </h1>
          <p className="text-night-300 mt-2 font-body">Your AI-powered fitness companion</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8"
        >
          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 mb-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-display font-medium transition-all duration-200"
                style={mode === m ? {
                  background: 'rgba(200,255,0,0.15)',
                  color: '#c8ff00',
                  border: '1px solid rgba(200,255,0,0.25)',
                } : { color: 'rgba(255,255,255,0.4)' }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-body"
              style={{ background: 'rgba(255,60,172,0.1)', border: '1px solid rgba(255,60,172,0.25)', color: '#ff70c4' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Full Name</label>
                    <input
                      className="input-field"
                      placeholder="John Doe"
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Username</label>
                    <input
                      className="input-field"
                      placeholder="johndoe"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-display font-medium text-night-300 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  className="input-field pr-12"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-night-300 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-acid w-full mt-6 flex items-center justify-center gap-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-night-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={18} />
                  {mode === 'login' ? 'Sign In' : 'Start My Journey'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-night-400 text-sm mt-6 font-body">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-medium transition-colors" style={{ color: '#c8ff00' }}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
