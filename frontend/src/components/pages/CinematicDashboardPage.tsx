import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Activity, ArrowRight, Dumbbell, Flame, RefreshCw, Salad, TrendingUp } from 'lucide-react'
import { RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { API, useAuthStore } from '@/store/authStore'

function MetricCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="glass-card group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="page-kicker">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold" style={{ color }}>{value}</p>
          <p className="mt-1 text-sm text-white/50">{sub}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function CinematicDashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, fetchProfile } = useAuthStore()

  const { data: summary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => API.get('/logs/summary').then((res) => res.data),
  })

  const generateMutation = useMutation({
    mutationFn: ({ regenerate }: { regenerate: boolean }) =>
      API.post('/plans/generate', { regenerate, workout_days_per_week: 4 }),
    onSuccess: () => {
      toast.success('Plans generated')
      qc.invalidateQueries({ queryKey: ['diet-plan'] })
      qc.invalidateQueries({ queryKey: ['workout-plan'] })
      fetchProfile()
    },
    onError: () => toast.error('Could not generate plans'),
  })

  const macroData = [
    { name: 'Protein', value: user?.target_protein_g || 0, fill: '#6fd6da' },
    { name: 'Carbs', value: user?.target_carbs_g || 0, fill: '#f6c35b' },
    { name: 'Fat', value: user?.target_fat_g || 0, fill: '#cf5a45' },
  ]

  const bmi = user?.weight_kg && user?.height_cm
    ? (user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1)
    : '--'

  return (
    <div className="page-wrap">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="hero-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Command Center</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Welcome back, {user?.full_name?.split(' ')[0] || user?.username}</h2>
            <p className="mt-3 max-w-2xl text-base text-muted">
              Your backend now defaults to a free local FitAI brain, with optional Gemini support when you want a hosted model later.
            </p>
          </div>

          <button onClick={() => generateMutation.mutate({ regenerate: !summary?.days_logged })} disabled={generateMutation.isPending} className="btn-acid">
            {generateMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Flame size={16} />}
            {generateMutation.isPending ? 'Generating' : 'Generate Plans'}
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="page-kicker">Goal</p>
            <p className="mt-3 font-display text-2xl font-semibold">{user?.goal?.replace('_', ' ') || 'Set profile'}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="page-kicker">Activity</p>
            <p className="mt-3 font-display text-2xl font-semibold">{user?.activity_level?.replace('_', ' ') || 'Not set'}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="page-kicker">Weekly Logs</p>
            <p className="mt-3 font-display text-2xl font-semibold">{summary?.days_logged || 0}</p>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Daily Calories" value={user?.target_calories || '--'} sub="target intake" icon={Flame} color="#f6c35b" />
        <MetricCard label="BMR" value={user?.bmr ? Math.round(user.bmr) : '--'} sub="base burn rate" icon={Activity} color="#6fd6da" />
        <MetricCard label="TDEE" value={user?.tdee ? Math.round(user.tdee) : '--'} sub="daily energy use" icon={TrendingUp} color="#cf5a45" />
        <MetricCard label="BMI" value={bmi} sub="body index" icon={Dumbbell} color="#ffe3a3" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Protein', `${user?.target_protein_g?.toFixed?.(0) || '--'} g`, '#6fd6da'],
            ['Carbs', `${user?.target_carbs_g?.toFixed?.(0) || '--'} g`, '#f6c35b'],
            ['Fat', `${user?.target_fat_g?.toFixed?.(0) || '--'} g`, '#cf5a45'],
          ].map(([label, value, color]) => (
            <div key={label} className="glass-card p-5">
              <p className="page-kicker">{label}</p>
              <p className="mt-4 font-display text-3xl font-semibold" style={{ color }}>{value}</p>
            </div>
          ))}

          <div className="glass-card p-5 sm:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <p className="page-kicker">This Week</p>
              <p className="text-sm text-white/45">{summary?.workouts_this_week || 0} workouts</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="font-display text-3xl font-semibold text-acid">{summary?.avg_calories_last_7d || '--'}</p>
                <p className="mt-1 text-sm text-white/50">Average calories</p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold text-cyber">{summary?.latest_weight_kg || user?.weight_kg || '--'}</p>
                <p className="mt-1 text-sm text-white/50">Latest weight</p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold text-plasma">{summary?.days_logged || 0}</p>
                <p className="mt-1 text-sm text-white/50">Logged days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="page-kicker">Macro Split</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart data={macroData} innerRadius="28%" outerRadius="92%">
                <RadialBar dataKey="value" cornerRadius={8} />
                <Tooltip contentStyle={{ background: 'rgba(20,15,13,0.96)', border: '1px solid rgba(246,195,91,0.16)', borderRadius: 18 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/60">
            {macroData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { title: 'Open Diet Plan', sub: 'Five-meal blueprint with macro detail', icon: Salad, to: '/diet', color: '#f6c35b' },
          { title: 'Open Workout Plan', sub: 'Weekly structure with recovery spacing', icon: Dumbbell, to: '/workout', color: '#6fd6da' },
        ].map((item) => (
          <button key={item.to} onClick={() => navigate(item.to)} className="glass-card flex items-center justify-between p-5 text-left transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-white/5">
                <item.icon size={24} style={{ color: item.color }} />
              </div>
              <div>
                <p className="font-display text-xl font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-white/50">{item.sub}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-white/40" />
          </button>
        ))}
      </section>
    </div>
  )
}
