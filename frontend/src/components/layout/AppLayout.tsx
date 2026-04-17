import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { LayoutDashboard, Salad, Dumbbell, TrendingUp, LogOut, User, Zap } from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/diet', icon: Salad, label: 'Diet Plan' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 flex flex-col shrink-0"
        style={{
          background: 'rgba(6,6,20,0.95)',
          borderRight: '1px solid rgba(200,255,0,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(200,255,0,0.15)', border: '1px solid rgba(200,255,0,0.25)' }}>
            <Dumbbell size={18} style={{ color: '#c8ff00' }} />
          </div>
          <span className="text-xl font-display font-bold">
            Fit<span style={{ color: '#c8ff00' }}>AI</span>
          </span>
        </div>

        {/* User info */}
        <div className="mx-4 p-3 rounded-xl mb-6"
          style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold"
              style={{ background: 'rgba(200,255,0,0.15)', color: '#c8ff00' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold truncate">{user?.full_name || user?.username}</p>
              <p className="text-xs font-body truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {user?.goal?.replace('_', ' ')} · {user?.weight_kg}kg
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-display font-medium text-sm transition-all duration-200 ${
                  isActive ? 'text-night-900' : 'text-night-300 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: '#c8ff00',
                boxShadow: '0 0 20px rgba(200,255,0,0.3)',
              } : {}}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 space-y-1">
          {user?.target_calories && (
            <div className="px-4 py-3 rounded-xl text-xs font-mono text-center mb-2"
              style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.1)', color: '#c8ff00' }}>
              🎯 {user.target_calories} kcal/day
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-display font-medium text-night-400 hover:text-white transition-colors"
            style={{ hover: {} }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
