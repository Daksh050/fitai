import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, ChevronRight, Shield, Target, TrendingUp, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

/* ────────────────────────────────────────────────
   Animated particle network canvas (background)
──────────────────────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf: number
    let W = (canvas.width = window.innerWidth)
    let H = (canvas.height = window.innerHeight)
    const COLORS = ['#00ff88', '#00d4ff', '#bf5af2', '#ffd60a', '#ff6b35']
    const pts = Array.from({ length: 100 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.55 + 0.1,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(0,255,136,${0.07 * (1 - d / 120)})`
            ctx.lineWidth = 0.6
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
        const p = pts[i]
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.c + Math.floor(p.a * 255).toString(16).padStart(2, '0')
        ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" />
}

/* ────────────────────────────────────────────────
   Ambient glow orbs (background layer)
──────────────────────────────────────────────── */
function GlowOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute" style={{ left: '-12%', top: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.09) 0%, transparent 65%)' }} />
      <div className="absolute" style={{ right: '-8%', top: '25%',  width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)' }} />
      <div className="absolute" style={{ left: '30%', bottom: '-8%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(191,90,242,0.06) 0%, transparent 65%)' }} />
    </div>
  )
}

/* ────────────────────────────────────────────────
   3-D floating brain orb hero element
──────────────────────────────────────────────── */
function HeroOrb() {
  return (
    <div className="relative flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96">
      {/* Rotating rings */}
      {[
        { size: 220, color: 'rgba(0,255,136,0.28)', dur: '8s' },
        { size: 280, color: 'rgba(0,212,255,0.16)', dur: '13s', reverse: true },
        { size: 340, color: 'rgba(191,90,242,0.10)', dur: '18s' },
      ].map(({ size, color, dur, reverse }) => (
        <div
          key={size}
          className="absolute rounded-full"
          style={{
            width: size, height: size,
            border: `1px solid ${color}`,
            animation: `orbit-spin ${dur} linear infinite ${reverse ? 'reverse' : ''}`,
          }}
        />
      ))}

      {/* Core sphere */}
      <div
        className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 32%, rgba(0,255,136,0.38), rgba(0,212,255,0.18) 45%, rgba(5,5,10,0.97))',
          boxShadow: '0 0 60px rgba(0,255,136,0.32), 0 0 120px rgba(0,255,136,0.14), inset 0 0 40px rgba(0,255,136,0.12)',
          animation: 'pulse-glow 2.8s ease-in-out infinite',
        }}
      >
        <Brain size={58} style={{ color: '#00ff88', filter: 'drop-shadow(0 0 14px rgba(0,255,136,0.85))' }} />
      </div>

      {/* Floating info pills */}
      {[
        { label: '2,416 kcal', color: '#ffd60a', top: '5%',  left: '-18%' },
        { label: '158g Protein', color: '#00ff88', bottom: '12%', left: '-22%' },
        { label: 'BMR: 1,763',  color: '#00d4ff', top: '10%', right: '-22%' },
        { label: '🧠 AI Brain', color: '#bf5af2', bottom: '8%', right: '-18%' },
      ].map((p, i) => (
        <motion.div
          key={p.label}
          className="absolute hidden whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold backdrop-blur-md md:block"
          style={{
            top: p.top, bottom: (p as any).bottom, left: p.left, right: (p as any).right,
            background: p.color + '14',
            border: `1px solid ${p.color}35`,
            color: p.color,
            boxShadow: `0 0 18px ${p.color}20`,
            fontFamily: 'JetBrains Mono, monospace',
          }}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.15 }}
        >
          {p.label}
        </motion.div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────
   Feature cards
──────────────────────────────────────────────── */
const FEATURES = [
  { icon: Brain,     title: 'FitAI Brain Engine', desc: 'Gemini AI generates unique plans — never canned advice. Your numbers drive every decision.',  color: '#00ff88' },
  { icon: Target,    title: 'Precision Macros',    desc: 'Mifflin-St Jeor BMR + TDEE + live USDA nutrition data → science-backed calorie targets.',    color: '#00d4ff' },
  { icon: Zap,       title: '5-Meal Blueprint',    desc: 'Breakfast to dinner, every item, every gram, with prep notes — generated fresh for you.',      color: '#ffd60a' },
  { icon: TrendingUp, title: 'Smart Workouts',     desc: 'Weekly training split matched to your goal, activity level, and available equipment.',         color: '#bf5af2' },
  { icon: Shield,    title: 'Neon DB Backed',      desc: 'Your data lives on a serverless Neon PostgreSQL database. Fast, reliable, always on.',          color: '#ff6b35' },
  { icon: ArrowRight, title: 'Live Progress',      desc: 'Log sessions and meals. Trend charts update in real time so you can see every gain.',          color: '#00c8ff' },
]

/* ──────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate()
  const { token, user } = useAuthStore()

  useEffect(() => {
    if (token) navigate(user?.is_onboarded ? '/' : '/onboarding', { replace: true })
  }, [token, user, navigate])

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#050508' }}>
      <ParticleCanvas />
      <GlowOrbs />

      {/* ── Navbar ──────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-10 lg:px-14"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #00ff88, #00c8ff)', boxShadow: '0 0 20px rgba(0,255,136,0.45)' }}
          >
            <Zap size={18} className="text-black" />
          </div>
          <span className="text-lg font-bold tracking-tight">FitAI</span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/auth')} className="btn-ghost px-5 py-2 text-sm">Sign In</button>
          <button onClick={() => navigate('/auth')} className="btn-neon px-5 py-2.5 text-sm">
            Get Started <ChevronRight size={14} />
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-10 sm:pt-12 lg:px-14 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Left — copy */}
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65 }}>
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-2 text-sm font-semibold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              AI Brain Engine — Live
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Your body.{' '}
              <span className="glow-green">Your plan.</span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #00ff88 0%, #00c8ff 50%, #bf5af2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Powered by AI.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>
              FitAI calculates your exact macros, builds a personalised 5-meal daily diet, and generates a weekly workout — all from your body data. Every plan is unique. Powered by Google Gemini.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate('/auth')} className="btn-neon px-8 py-3.5 text-base">
                Start Free <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/auth')} className="btn-ghost px-7 py-3.5 text-base">
                Sign In
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {['No credit card', 'Gemini AI Brain', 'Neon DB backend', 'Mobile-ready'].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {t}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — 3-D orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="float-anim flex justify-center"
          >
            <HeroOrb />
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────── */}
      <div
        className="relative z-10 border-y py-6"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.018)' }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-14 gap-y-5 px-6 text-center">
          {[
            ['7.5M+', 'Users Worldwide'],
            ['5-Meal', 'Daily Blueprint'],
            ['100%', 'AI Personalised'],
            ['Neon DB', 'Always-On Storage'],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="font-display text-2xl font-bold text-neon">{val}</p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features grid ───────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400">What FitAI Does</p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Built different. Built for results.</h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">Not generic. Every plan generated fresh from <em>your</em> exact numbers by the FitAI Brain.</p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="neon-card p-7"
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: f.color + '14', border: `1px solid ${f.color}28` }}
              >
                <f.icon size={22} style={{ color: f.color }} />
              </div>
              <h3 className="mb-2 text-base font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Ready to build your <span className="glow-green">perfect plan?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-muted">
            Answer a few questions. FitAI calculates your macros and generates your full program in seconds.
          </p>
          <button onClick={() => navigate('/auth')} className="btn-neon mx-auto mt-8 px-10 py-4 text-base">
            Build My Plan — Free <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8 text-center text-sm text-muted" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        © 2025 FitAI · Powered by Google Gemini · Stored on Neon PostgreSQL
      </footer>
    </div>
  )
}
