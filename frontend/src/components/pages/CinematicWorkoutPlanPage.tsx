import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Moon, Timer } from 'lucide-react'
import { API } from '@/store/authStore'
import BluetoothTracker from '@/components/BluetoothTracker'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }

function DayCard({ day, session }: { day: string; session: any }) {
  const [open, setOpen] = useState(day === 'monday')

  if (session?.rest) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 font-display text-sm font-semibold text-white/70">
            {LABELS[day]}
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">{session.session_name}</p>
            <p className="mt-1 text-sm text-white/50">{session.activities?.join(', ')}</p>
          </div>
          <Moon size={18} className="text-white/35" />
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-start gap-4 p-5 text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 font-display text-sm font-semibold text-acid">
          {LABELS[day]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold">{session.session_name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/45">
            <Timer size={13} />
            {session.duration_minutes} min
            <span>• {session.exercises?.length || 0} exercises</span>
          </p>
        </div>
        {open ? <ChevronUp size={18} className="mt-1 text-white/40" /> : <ChevronDown size={18} className="mt-1 text-white/40" />}
      </button>

      {open && (
        <div className="border-t border-white/8 p-5 pt-0">
          <div className="space-y-3 pt-4">
            <div className="rounded-[22px] border border-white/8 bg-black/10 p-4 text-sm text-white/62">
              Warm-up: {session.warm_up}
            </div>
            {session.exercises?.map((exercise: any, index: number) => (
              <div key={index} className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-display text-base font-semibold">{exercise.name}</p>
                    <p className="mt-1 text-sm text-white/45">{exercise.muscle_group} • {exercise.notes}</p>
                  </div>
                  <div className="font-mono text-sm text-white/65 sm:text-right">
                    <p>{exercise.sets} x {exercise.reps}</p>
                    <p className="mt-1">{exercise.rest_seconds}s rest</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-[22px] border border-white/8 bg-black/10 p-4 text-sm text-white/62">
              Cool-down: {session.cool_down}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function CinematicWorkoutPlanPage() {
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['workout-plan'],
    queryFn: () => API.get('/plans/workout/active').then((res) => res.data),
    retry: false,
  })

  return (
    <div className="page-wrap">
      <section className="hero-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Training Grid</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Weekly workout structure</h2>
            <p className="mt-3 max-w-2xl text-base text-muted">
              Sessions, rest spacing, and movement notes are arranged for easy scan on mobile without losing detail on large screens.
            </p>
          </div>
          {plan?.focus_muscles?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plan.focus_muscles.map((muscle: string) => (
                <span key={muscle} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-white/70">{muscle}</span>
              ))}
            </div>
          )}
        </div>
        {plan?.notes && <p className="mt-5 max-w-3xl text-sm text-white/62">{plan.notes}</p>}
      </section>

      <BluetoothTracker />

      {isLoading && (
        <div className="space-y-4">
          {[...Array(7)].map((_, index) => <div key={index} className="glass-card h-24 shimmer" />)}
        </div>
      )}

      {error && (
        <div className="glass-card p-10 text-center">
          <p className="font-display text-2xl font-semibold">No workout plan yet</p>
          <p className="mt-3 text-sm text-white/55">Generate plans from the dashboard to populate this screen.</p>
        </div>
      )}

      {plan && (
        <>
          <section className="space-y-4">
            {DAYS.map((day) => plan.weekly_schedule?.[day] && <DayCard key={day} day={day} session={plan.weekly_schedule[day]} />)}
          </section>

          {plan.equipment_needed?.length > 0 && (
            <section className="glass-card p-5">
              <p className="page-kicker">Equipment</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.equipment_needed.map((item: string) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-white/70">{item}</span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
