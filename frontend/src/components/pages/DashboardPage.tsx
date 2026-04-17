import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { API, useAuthStore } from '@/store/authStore'
import { Zap, TrendingUp, Flame, Dumbbell, Salad, ChevronRight, RefreshCw, Activity } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'

function MacroCard({ label, value, unit, color, current, target }: any) {
  const pct = Math.min((current / target) * 100, 100) || 0
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-display font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
          {value}{unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      <p className="text-night-400 text-xs mt-2 font-body">{Math.round(pct)}% of daily target</p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass-card p-5 cursor-default">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-display font-medium uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
          <p className="text-3xl font-display font-bold" style={{ color }}>{value}</p>
          {sub && <p className="text-xs mt-1 font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, fetchProfile } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: summary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => API.get('/logs/summary').then(r => r.data),
  })

  const generateMutation = useMutation({
    mutationFn: (regenerate = false) =>
      API.post('/plans/generate', { regenerate, workout_days_per_week: 4 }),
    onSuccess: () => {
      toast.success('AI plans generated! 🎉')
      qc.invalidateQueries({ queryKey: ['diet-plan'] })
      qc.invalidateQueries({ queryKey: ['workout-plan'] })
      fetchProfile()
    },
    onError: () => toast.error('Generation failed. Check your API keys.'),
  })

  const bmi = user?.weight_kg && user?.height_cm
    ? (user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1)
    : '--'

  const macroData = [
    { name: 'Protein', value: user?.target_protein_g || 0, fill: '#00f5ff' },
    { name: 'Carbs', value: user?.target_carbs_g || 0, fill: '#c8ff00' },
    { name: 'Fat', value: user?.target_fat_g || 0, fill: '#ff3cac' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Hey, {user?.full_name?.split(' ')[0] || user?.username} 👋
            </h1>
            <p className="text-night-400 mt-1 font-body">
              {user?.goal?.replace('_', ' ')} · {user?.activity_level?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={() => generateMutation.mutate(!summary?.days_logged)}
            disabled={generateMutation.isPending}
            className="btn-acid flex items-center gap-2"
          >
            {generateMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-night-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {generateMutation.isPending ? 'Generating...' : 'Generate AI Plans'}
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Flame} label="Daily Calories" value={user?.target_calories || '--'} sub="kcal target" color="#c8ff00" />
        <StatCard icon={Activity} label="BMR" value={user?.bmr ? Math.round(user.bmr) : '--'} sub="base metabolic rate" color="#00f5ff" />
        <StatCard icon={TrendingUp} label="TDEE" value={user?.tdee ? Math.round(user.tdee) : '--'} sub="total daily expenditure" color="#ff3cac" />
        <StatCard icon={Dumbbell} label="BMI" value={bmi} sub={parseFloat(bmi as string) < 25 ? 'Normal range' : 'Review needed'} color="#a78bfa" />
      </div>

      {/* Macro + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <MacroCard label="Protein" value={user?.target_protein_g?.toFixed(0) || '--'} unit="g" color="#00f5ff" current={user?.target_protein_g || 0} target={user?.target_protein_g || 1} />
          <MacroCard label="Carbs" value={user?.target_carbs_g?.toFixed(0) || '--'} unit="g" color="#c8ff00" current={user?.target_carbs_g || 0} target={user?.target_carbs_g || 1} />
          <MacroCard label="Fat" value={user?.target_fat_g?.toFixed(0) || '--'} unit="g" color="#ff3cac" current={user?.target_fat_g || 0} target={user?.target_fat_g || 1} />

          {/* Weekly summary */}
          {summary && (
            <div className="col-span-3 glass-card p-5">
              <p className="text-xs font-display font-medium uppercase tracking-widest text-night-400 mb-4">This Week</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-display font-bold" style={{ color: '#c8ff00' }}>{summary.workouts_this_week || 0}</p>
                  <p className="text-xs text-night-400 mt-1 font-body">Workouts done</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold" style={{ color: '#00f5ff' }}>{summary.avg_calories_last_7d || '--'}</p>
                  <p className="text-xs text-night-400 mt-1 font-body">Avg calories</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold" style={{ color: '#ff3cac' }}>{summary.latest_weight_kg || user?.weight_kg || '--'}</p>
                  <p className="text-xs text-night-400 mt-1 font-body">kg weight</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Radial macro chart */}
        <div className="glass-card p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-display font-medium uppercase tracking-widest text-night-400 mb-4">Macro Split</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" data={macroData}>
              <RadialBar dataKey="value" cornerRadius={4} />
              <Tooltip
                contentStyle={{ background: '#0c0c26', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 8, fontSize: 12 }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {macroData.map(m => (
              <div key={m.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.fill }} />
                <span className="text-xs font-body text-night-300">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'View Diet Plan', sub: '5 meals · personalized', icon: Salad, to: '/diet', color: '#c8ff00' },
          { label: 'View Workout', sub: '4 days/week · muscle gain', icon: Dumbbell, to: '/workout', color: '#00f5ff' },
        ].map(item => (
          <motion.button
            key={item.to}
            whileHover={{ y: -2 }}
            onClick={() => navigate(item.to)}
            className="glass-card p-5 text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                <item.icon size={22} style={{ color: item.color }} />
              </div>
              <div>
                <p className="font-display font-semibold">{item.label}</p>
                <p className="text-xs text-night-400 font-body mt-0.5">{item.sub}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-night-500 group-hover:text-white transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
