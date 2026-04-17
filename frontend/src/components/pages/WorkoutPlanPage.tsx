import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { API } from '@/store/authStore'
import { useState } from 'react'
import { Timer, Repeat, ChevronDown, ChevronUp, Zap, Moon } from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ff3cac', back: '#00f5ff', legs: '#c8ff00', shoulders: '#a78bfa',
  arms: '#fb923c', core: '#34d399', triceps: '#ff3cac', biceps: '#fb923c',
}

function ExerciseRow({ ex, index }: { ex: any; index: number }) {
  const color = ex.is_compound ? '#c8ff00' : '#00f5ff'
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 py-3 px-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5"
        style={{ background: `${color}15`, color }}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-body font-medium text-sm">{ex.name}</p>
          {ex.is_compound && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'rgba(200,255,0,0.12)', color: '#c8ff00', border: '1px solid rgba(200,255,0,0.2)' }}>
              compound
            </span>
          )}
          {ex.muscle_group && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{
                background: `${MUSCLE_COLORS[ex.muscle_group.toLowerCase()] || '#ffffff'}12`,
                color: MUSCLE_COLORS[ex.muscle_group.toLowerCase()] || 'rgba(255,255,255,0.5)',
              }}>
              {ex.muscle_group}
            </span>
          )}
        </div>
        {ex.notes && <p className="text-xs text-night-400 font-body mt-1">{ex.notes}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-mono font-medium" style={{ color }}>
          {ex.sets} × {ex.reps}
        </p>
        <p className="text-xs text-night-400 font-mono mt-0.5 flex items-center justify-end gap-1">
          <Timer size={10} /> {ex.rest_seconds}s
        </p>
      </div>
    </motion.div>
  )
}

function DayCard({ day, session }: { day: string; session: any }) {
  const [open, setOpen] = useState(false)
  const isRest = session?.rest === true
  const color = isRest ? '#4b5563' : '#c8ff00'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <button className="w-full p-5 text-left" onClick={() => !isRest && setOpen(!open)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-sm"
            style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}>
            {DAY_LABELS[day]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm">{session?.session_name || 'Rest Day'}</p>
            {!isRest && session?.duration_minutes && (
              <p className="text-xs text-night-400 font-body mt-0.5 flex items-center gap-1.5">
                <Timer size={11} /> {session.duration_minutes} min
                {session?.exercises?.length > 0 && (
                  <span className="ml-1">· {session.exercises.length} exercises</span>
                )}
              </p>
            )}
            {isRest && (
              <p className="text-xs text-night-500 font-body mt-0.5">
                {session?.activities?.join(', ') || 'Active recovery'}
              </p>
            )}
          </div>
          {isRest
            ? <Moon size={16} className="text-night-500 shrink-0" />
            : open
              ? <ChevronUp size={16} className="text-night-400 shrink-0" />
              : <ChevronDown size={16} className="text-night-400 shrink-0" />}
        </div>
      </button>

      {open && !isRest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t px-5 pb-5 pt-3 space-y-2"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {session.warm_up && (
            <p className="text-xs px-3 py-2 rounded-lg font-body text-night-300"
              style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.08)' }}>
              🔥 Warm-up: {session.warm_up}
            </p>
          )}
          {session.exercises?.map((ex: any, i: number) => (
            <ExerciseRow key={i} ex={ex} index={i} />
          ))}
          {session.cool_down && (
            <p className="text-xs px-3 py-2 rounded-lg font-body text-night-300 mt-2"
              style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.08)' }}>
              ❄️ Cool-down: {session.cool_down}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default function WorkoutPlanPage() {
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['workout-plan'],
    queryFn: () => API.get('/plans/workout/active').then(r => r.data),
    retry: false,
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="text-3xl font-display font-bold">Workout Plan</h1>
        {plan && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <p className="text-night-400 font-body">{plan.title}</p>
            {plan.focus_muscles?.map((m: string) => (
              <span key={m} className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{
                  background: `${MUSCLE_COLORS[m] || '#ffffff'}12`,
                  color: MUSCLE_COLORS[m] || 'rgba(255,255,255,0.5)',
                  border: `1px solid ${MUSCLE_COLORS[m] || '#ffffff'}25`,
                }}>
                {m}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded shimmer" />
                  <div className="h-3 w-24 rounded shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">🏋️</p>
          <p className="font-display font-semibold text-lg mb-2">No workout plan yet</p>
          <p className="text-night-400 font-body text-sm">Go to Dashboard and click "Generate AI Plans" to create your personalized plan.</p>
        </div>
      )}

      {plan && (
        <>
          {plan.notes && (
            <div className="mb-6 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.12)' }}>
              <p className="text-sm font-body text-night-200 leading-relaxed">💡 {plan.notes}</p>
            </div>
          )}
          <div className="space-y-3">
            {DAYS.map(day => plan.weekly_schedule[day] && (
              <DayCard key={day} day={day} session={plan.weekly_schedule[day]} />
            ))}
          </div>

          {plan.equipment_needed?.length > 0 && (
            <div className="mt-6 glass-card p-5">
              <p className="text-xs font-display font-medium uppercase tracking-widest text-night-400 mb-3">Equipment Needed</p>
              <div className="flex flex-wrap gap-2">
                {plan.equipment_needed.map((eq: string) => (
                  <span key={eq} className="stat-pill text-xs">{eq}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
