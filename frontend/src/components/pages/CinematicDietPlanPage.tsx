import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Clock, Flame } from 'lucide-react'
import { API } from '@/store/authStore'

function MacroBadge({ value, label, color }: any) {
  return (
    <span className="rounded-full border px-3 py-1 text-xs font-mono" style={{ background: `${color}14`, borderColor: `${color}30`, color }}>
      {value}g {label}
    </span>
  )
}

function MealCard({ meal, index }: { meal: any; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const accent = ['#f6c35b', '#6fd6da', '#cf5a45', '#ffe3a3', '#f29b84'][index % 5]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="glass-card overflow-hidden">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-start gap-4 p-5 text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 font-display text-lg font-semibold" style={{ color: accent }}>
          {meal.meal_number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-lg font-semibold">{meal.meal_name}</h3>
            <span className="flex items-center gap-1 text-xs text-white/45">
              <Clock size={12} />
              {meal.time_suggestion}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="stat-pill">
              <Flame size={12} />
              {meal.total_calories} kcal
            </span>
            <MacroBadge value={meal.total_protein_g} label="P" color="#6fd6da" />
            <MacroBadge value={meal.total_carbs_g} label="C" color="#f6c35b" />
            <MacroBadge value={meal.total_fat_g} label="F" color="#cf5a45" />
          </div>
        </div>
        {open ? <ChevronUp size={18} className="mt-1 text-white/40" /> : <ChevronDown size={18} className="mt-1 text-white/40" />}
      </button>

      {open && (
        <div className="border-t border-white/8 p-5 pt-0">
          <div className="space-y-3 pt-4">
            {meal.items?.map((item: any, itemIndex: number) => (
              <div key={itemIndex} className="rounded-[22px] border border-white/8 bg-white/5 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-display text-base font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm text-white/45">{item.quantity}</p>
                  </div>
                  <div className="text-sm text-white/60 sm:text-right">
                    <p className="font-mono text-acid">{item.calories} kcal</p>
                    <p className="mt-1 font-mono">P {item.protein_g} • C {item.carbs_g} • F {item.fat_g}</p>
                  </div>
                </div>
              </div>
            ))}
            {meal.preparation_notes && (
              <div className="rounded-[22px] border border-white/10 bg-black/10 p-4 text-sm text-white/65">
                {meal.preparation_notes}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function CinematicDietPlanPage() {
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['diet-plan'],
    queryFn: () => API.get('/plans/diet/active').then((res) => res.data),
    retry: false,
  })

  return (
    <div className="page-wrap">
      <section className="hero-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Nutrition Blueprint</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Daily meal architecture</h2>
            <p className="mt-3 max-w-2xl text-base text-muted">
              A five-meal structure designed to stay practical through a working day and still keep the macro target visible at a glance.
            </p>
          </div>
          {plan && (
            <div className="flex flex-wrap gap-2">
              <span className="stat-pill">{plan.total_calories} kcal</span>
              <MacroBadge value={plan.protein_g} label="Protein" color="#6fd6da" />
              <MacroBadge value={plan.carbs_g} label="Carbs" color="#f6c35b" />
              <MacroBadge value={plan.fat_g} label="Fat" color="#cf5a45" />
            </div>
          )}
        </div>
        {plan?.notes && <p className="mt-5 max-w-3xl text-sm text-white/62">{plan.notes}</p>}
      </section>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => <div key={index} className="glass-card h-28 shimmer" />)}
        </div>
      )}

      {error && (
        <div className="glass-card p-10 text-center">
          <p className="font-display text-2xl font-semibold">No diet plan yet</p>
          <p className="mt-3 text-sm text-white/55">Generate plans from the dashboard to populate this screen.</p>
        </div>
      )}

      {plan && (
        <section className="space-y-4">
          {plan.meals?.map((meal: any, index: number) => (
            <MealCard key={index} meal={meal} index={index} />
          ))}
        </section>
      )}
    </div>
  )
}
