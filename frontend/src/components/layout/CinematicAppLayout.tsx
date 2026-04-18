import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Brain, Dumbbell, Flame, LayoutDashboard, LogOut, Salad, TrendingUp, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/diet', icon: Salad, label: 'Diet Plan' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
]

function NavItem({ to, label, icon: Icon, exact = false }: { to: string; label: string; icon: any; exact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
          isActive ? 'nav-link active' : 'nav-link'
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  )
}

export default function CinematicAppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle = NAV.find((n) => (n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/') || (n.exact && location.pathname === '/'))?.label || 'Dashboard'

  const handleLogout = () => { logout(); navigate('/landing') }

  return (
    <div className="relative flex min-h-screen" style={{ background: '#050508' }}>
      {/* Grid BG */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-5%] h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%)' }} />
        <div className="absolute right-[-5%] bottom-[10%] h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* ─── Sidebar ─── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="relative z-10 hidden w-72 shrink-0 flex-col border-r border-white/5 px-4 py-6 lg:flex"
        style={{ background: 'rgba(10,10,16,0.8)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #00ff88, #00d4ff)', boxShadow: '0 0 20px rgba(0,255,136,0.35)' }}>
            <Zap size={17} className="text-black" />
          </div>
          <div>
            <p className="font-bold leading-none">FitAI</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted">AI Fitness Engine</p>
          </div>
        </div>

        {/* User card */}
        <div className="neon-card mb-6 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,212,255,0.15))', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.full_name || user?.username}</p>
              <p className="truncate text-xs text-muted capitalize">{user?.goal?.replace('_', ' ') || 'Goal not set'}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2">
              <p className="text-muted">Target</p>
              <p className="mt-0.5 font-mono font-semibold text-neon">{user?.target_calories || '--'} kcal</p>
            </div>
            <div className="rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2">
              <p className="text-muted">Weight</p>
              <p className="mt-0.5 font-mono font-semibold text-neon-blue">{user?.weight_kg || '--'} kg</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {NAV.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>

        {/* Bottom */}
        <div className="mt-auto space-y-3">
          <div className="neon-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Live Stats</p>
              <Activity size={14} className="text-neon" />
            </div>
            {[
              ['Protein', `${user?.target_protein_g?.toFixed?.(0) || '--'} g`, '#00d4ff'],
              ['Carbs', `${user?.target_carbs_g?.toFixed?.(0) || '--'} g`, '#ffd60a'],
              ['Fat', `${user?.target_fat_g?.toFixed?.(0) || '--'} g`, '#ff6b35'],
            ].map(([label, val, color]) => (
              <div key={label} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
                <span className="text-xs text-muted">{label}</span>
                <span className="font-mono text-xs font-semibold" style={{ color }}>{val}</span>
              </div>
            ))}
          </div>

          <button onClick={handleLogout} className="btn-ghost w-full text-sm">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* ─── Main content ─── */}
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-8"
          style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(20px)' }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">FitAI Runtime</p>
            <h1 className="mt-0.5 text-lg font-bold">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-neon/15 bg-neon/8 px-4 py-2 text-sm font-semibold text-neon sm:flex">
              <Brain size={14} />
              AI Brain Active
            </div>
            <div className="hidden rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-sm text-muted sm:block">
              <Flame size={14} className="inline mr-1.5 text-orange-400" />
              {user?.target_calories || '--'} kcal
            </div>
            <button onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-muted transition-colors hover:text-white lg:hidden">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 pb-28 sm:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile bottom nav ─── */}
      <div
        className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-white/8 p-2 lg:hidden"
        style={{ background: 'rgba(10,10,16,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <div className="grid grid-cols-4 gap-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-medium transition-all ${
                  isActive ? 'text-dark-bg' : 'text-muted'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'linear-gradient(135deg, #00ff88, #00d4ff)', boxShadow: '0 0 16px rgba(0,255,136,0.3)' }
                  : {}
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
