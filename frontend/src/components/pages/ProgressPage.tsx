import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { API } from '@/store/authStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PlusCircle, Check } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs font-mono"
      style={{ background: '#0c0c26', border: '1px solid rgba(200,255,0,0.2)' }}>
      <p className="text-night-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function ProgressPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    weight_kg: '', calories_consumed: '', protein_consumed_g: '',
    workout_completed: false, workout_duration_min: '', mood_score: '3', notes: '',
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: () => API.get('/logs?limit=30').then(r => r.data),
  })

  const logMutation = useMutation({
    mutationFn: (data: any) => API.post('/logs/', data),
    onSuccess: () => {
      toast.success('Progress logged! 💪')
      qc.invalidateQueries({ queryKey: ['logs'] })
      qc.invalidateQueries({ queryKey: ['progress-summary'] })
      setForm({ weight_kg: '', calories_consumed: '', protein_consumed_g: '', workout_completed: false, workout_duration_min: '', mood_score: '3', notes: '' })
    },
    onError: () => toast.error('Failed to log progress'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    logMutation.mutate({
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
      calories_consumed: form.calories_consumed ? parseInt(form.calories_consumed) : undefined,
      protein_consumed_g: form.protein_consumed_g ? parseFloat(form.protein_consumed_g) : undefined,
      workout_completed: form.workout_completed,
      workout_duration_min: form.workout_duration_min ? parseInt(form.workout_duration_min) : undefined,
      mood_score: parseInt(form.mood_score),
      notes: form.notes || undefined,
    })
  }

  const chartData = [...logs].reverse().slice(-14).map((l: any) => ({
    date: new Date(l.log_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: l.weight_kg,
    calories: l.calories_consumed,
    protein: l.protein_consumed_g,
  }))

  const MOODS = ['😞', '😕', '😐', '🙂', '😄']

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="text-3xl font-display font-bold">Progress Tracker</h1>
        <p className="text-night-400 mt-1 font-body text-sm">Log daily metrics to track your journey</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Log form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-base mb-5 flex items-center gap-2">
              <PlusCircle size={18} style={{ color: '#c8ff00' }} /> Log Today
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-medium text-night-400 mb-1.5 uppercase tracking-widest">Weight kg</label>
                  <input className="input-field text-sm" type="number" step="0.1" placeholder="72.5"
                    value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-display font-medium text-night-400 mb-1.5 uppercase tracking-widest">Calories</label>
                  <input className="input-field text-sm" type="number" placeholder="2500"
                    value={form.calories_consumed} onChange={e => setForm(f => ({ ...f, calories_consumed: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-medium text-night-400 mb-1.5 uppercase tracking-widest">Protein (g)</label>
                <input className="input-field text-sm" type="number" placeholder="150"
                  value={form.protein_consumed_g} onChange={e => setForm(f => ({ ...f, protein_consumed_g: e.target.value }))} />
              </div>

              {/* Workout toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-sm font-body">Workout done today?</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, workout_completed: !f.workout_completed }))}
                  className="w-12 h-6 rounded-full transition-all duration-300 relative"
                  style={{ background: form.workout_completed ? '#c8ff00' : 'rgba(255,255,255,0.12)' }}>
                  <div className="w-4 h-4 rounded-full bg-night-900 absolute top-1 transition-all duration-300"
                    style={{ left: form.workout_completed ? '28px' : '4px' }} />
                </button>
              </div>

              {form.workout_completed && (
                <div>
                  <label className="block text-xs font-display font-medium text-night-400 mb-1.5 uppercase tracking-widest">Duration (min)</label>
                  <input className="input-field text-sm" type="number" placeholder="60"
                    value={form.workout_duration_min} onChange={e => setForm(f => ({ ...f, workout_duration_min: e.target.value }))} />
                </div>
              )}

              {/* Mood */}
              <div>
                <label className="block text-xs font-display font-medium text-night-400 mb-2 uppercase tracking-widest">Mood</label>
                <div className="flex gap-2">
                  {MOODS.map((emoji, i) => (
                    <button key={i} type="button"
                      onClick={() => setForm(f => ({ ...f, mood_score: String(i + 1) }))}
                      className="flex-1 py-2 text-xl rounded-xl transition-all duration-200"
                      style={form.mood_score === String(i + 1) ? {
                        background: 'rgba(200,255,0,0.15)',
                        border: '1px solid rgba(200,255,0,0.3)',
                        transform: 'scale(1.1)',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-medium text-night-400 mb-1.5 uppercase tracking-widest">Notes</label>
                <textarea className="input-field text-sm resize-none" rows={2} placeholder="How was your day?"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <button type="submit" disabled={logMutation.isPending} className="btn-acid w-full flex items-center justify-center gap-2">
                {logMutation.isPending
                  ? <div className="w-4 h-4 border-2 border-night-900 border-t-transparent rounded-full animate-spin" />
                  : <><Check size={16} /> Save Today's Log</>}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="lg:col-span-3 space-y-4">
          {chartData.length > 0 && (
            <>
              <div className="glass-card p-5">
                <p className="text-xs font-display font-medium uppercase tracking-widest text-night-400 mb-4">Weight (kg)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="weight" stroke="#c8ff00" strokeWidth={2} dot={{ fill: '#c8ff00', r: 3 }} name="Weight" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-5">
                <p className="text-xs font-display font-medium uppercase tracking-widest text-night-400 mb-4">Calories & Protein</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="calories" stroke="#ff3cac" strokeWidth={2} dot={{ fill: '#ff3cac', r: 3 }} name="Calories" />
                    <Line type="monotone" dataKey="protein" stroke="#00f5ff" strokeWidth={2} dot={{ fill: '#00f5ff', r: 3 }} name="Protein (g)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Log history */}
          <div className="glass-card p-5">
            <p className="text-xs font-display font-medium uppercase tracking-widest text-night-400 mb-4">Recent Logs</p>
            {logs.length === 0 ? (
              <p className="text-night-500 font-body text-sm text-center py-4">No logs yet. Start tracking above!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {logs.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg text-xs font-mono"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-night-400">{new Date(log.log_date).toLocaleDateString()}</span>
                    <div className="flex gap-3">
                      {log.weight_kg && <span style={{ color: '#c8ff00' }}>{log.weight_kg}kg</span>}
                      {log.calories_consumed && <span style={{ color: '#ff3cac' }}>{log.calories_consumed}kcal</span>}
                      {log.workout_completed && <span style={{ color: '#00f5ff' }}>✓ workout</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
