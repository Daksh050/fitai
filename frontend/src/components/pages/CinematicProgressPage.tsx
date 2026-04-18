import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Check, PlusCircle } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { API } from '@/store/authStore'

const MOODS = ['1', '2', '3', '4', '5']

export default function CinematicProgressPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    weight_kg: '',
    calories_consumed: '',
    protein_consumed_g: '',
    workout_completed: false,
    workout_duration_min: '',
    mood_score: '3',
    notes: '',
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: () => API.get('/logs?limit=30').then((res) => res.data),
  })

  const logMutation = useMutation({
    mutationFn: (payload: any) => API.post('/logs/', payload),
    onSuccess: () => {
      toast.success('Progress logged')
      qc.invalidateQueries({ queryKey: ['logs'] })
      qc.invalidateQueries({ queryKey: ['progress-summary'] })
      setForm({
        weight_kg: '',
        calories_consumed: '',
        protein_consumed_g: '',
        workout_completed: false,
        workout_duration_min: '',
        mood_score: '3',
        notes: '',
      })
    },
    onError: () => toast.error('Could not save log'),
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

  const chartData = [...logs].reverse().slice(-14).map((entry: any) => ({
    date: new Date(entry.log_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: entry.weight_kg,
    calories: entry.calories_consumed,
    protein: entry.protein_consumed_g,
  }))

  return (
    <div className="page-wrap">
      <section className="hero-panel">
        <p className="page-kicker">Progress Console</p>
        <h2 className="mt-3 font-display text-4xl font-semibold">Track daily recovery, food, and training.</h2>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Large hit areas, compact charts, and clearer cards make the tracker easier to use across phone and desktop screens.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <PlusCircle size={18} className="text-acid" />
            <h3 className="font-display text-2xl font-semibold">Log Today</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="input-field" type="number" placeholder="Weight (kg)" value={form.weight_kg} onChange={(e) => setForm((current) => ({ ...current, weight_kg: e.target.value }))} />
              <input className="input-field" type="number" placeholder="Calories" value={form.calories_consumed} onChange={(e) => setForm((current) => ({ ...current, calories_consumed: e.target.value }))} />
            </div>

            <input className="input-field" type="number" placeholder="Protein (g)" value={form.protein_consumed_g} onChange={(e) => setForm((current) => ({ ...current, protein_consumed_g: e.target.value }))} />

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-base font-semibold">Workout completed</p>
                  <p className="mt-1 text-sm text-white/50">Toggle this on if you trained today.</p>
                </div>
                <button type="button" onClick={() => setForm((current) => ({ ...current, workout_completed: !current.workout_completed }))} className="relative h-7 w-14 rounded-full transition-all duration-300" style={{ background: form.workout_completed ? '#f6c35b' : 'rgba(255,255,255,0.12)' }}>
                  <span className="absolute top-1 h-5 w-5 rounded-full bg-night-950 transition-all duration-300" style={{ left: form.workout_completed ? '32px' : '4px' }} />
                </button>
              </div>
            </div>

            {form.workout_completed && (
              <input className="input-field" type="number" placeholder="Workout duration (min)" value={form.workout_duration_min} onChange={(e) => setForm((current) => ({ ...current, workout_duration_min: e.target.value }))} />
            )}

            <div>
              <p className="mb-3 font-display text-base font-semibold">Mood score</p>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((mood) => (
                  <button key={mood} type="button" onClick={() => setForm((current) => ({ ...current, mood_score: mood }))} className="rounded-2xl border px-3 py-3 text-sm font-display transition-all duration-300" style={form.mood_score === mood ? { background: 'rgba(246,195,91,0.14)', borderColor: 'rgba(246,195,91,0.34)', color: '#f6c35b' } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}>
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <textarea className="input-field min-h-24 resize-none" placeholder="Notes about recovery, hunger, or training" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />

            <button type="submit" disabled={logMutation.isPending} className="btn-acid w-full">
              {logMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-night-950 border-t-transparent" /> : <Check size={16} />}
              Save Log
            </button>
          </form>
        </motion.section>

        <section className="space-y-4">
          {chartData.length > 0 && (
            <>
              <div className="glass-card p-5">
                <p className="page-kicker">Weight Trend</p>
                <div className="mt-4 h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(20,15,13,0.96)', border: '1px solid rgba(246,195,91,0.16)', borderRadius: 18 }} />
                      <Line type="monotone" dataKey="weight" stroke="#f6c35b" strokeWidth={2.5} dot={{ fill: '#f6c35b', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-5">
                <p className="page-kicker">Nutrition Trend</p>
                <div className="mt-4 h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(20,15,13,0.96)', border: '1px solid rgba(246,195,91,0.16)', borderRadius: 18 }} />
                      <Line type="monotone" dataKey="calories" stroke="#cf5a45" strokeWidth={2.2} dot={{ fill: '#cf5a45', r: 3 }} />
                      <Line type="monotone" dataKey="protein" stroke="#6fd6da" strokeWidth={2.2} dot={{ fill: '#6fd6da', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          <div className="glass-card p-5">
            <p className="page-kicker">Recent Logs</p>
            <div className="mt-4 space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-white/55">No logs yet. Add your first entry from the form.</p>
              ) : (
                logs.slice(0, 10).map((entry: any) => (
                  <div key={entry.id} className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-display text-base font-semibold">{new Date(entry.log_date).toLocaleDateString()}</p>
                      <div className="flex flex-wrap gap-2 text-xs font-mono text-white/65">
                        {entry.weight_kg && <span className="rounded-full border border-white/10 px-2 py-1">{entry.weight_kg} kg</span>}
                        {entry.calories_consumed && <span className="rounded-full border border-white/10 px-2 py-1">{entry.calories_consumed} kcal</span>}
                        {entry.workout_completed && <span className="rounded-full border border-white/10 px-2 py-1">Workout done</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
