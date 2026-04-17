import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { API } from '@/store/authStore'
import { Clock, Flame, Beef, Wheat, Droplets, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

function MacroBadge({ value, label, color }: any) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium"
      style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
      {value}g {label}
    </span>
  )
}

function MealCard({ meal, index }: { meal: any; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const colors = ['#c8ff00', '#00f5ff', '#ff3cac', '#a78bfa', '#fb923c']
  const color = colors[index % colors.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card overflow-hidden"
    >
      <button className="w-full p-5 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-4">
          {/* Meal number indicator */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-lg"
            style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
            {meal.meal_number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-display font-semibold text-base">{meal.meal_name}</h3>
              <span className="flex items-center gap-1 text-xs text-night-400 font-body">
                <Clock size={12} /> {meal.time_suggestion}
              </span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="stat-pill text-xs">
                <Flame size={11} /> {meal.total_calories} kcal
              </span>
              <MacroBadge value={meal.total_protein_g} label="P" color="#00f5ff" />
              <MacroBadge value={meal.total_carbs_g} label="C" color="#c8ff00" />
              <MacroBadge value={meal.total_fat_g} label="F" color="#ff3cac" />
            </div>
          </div>
          {open ? <ChevronUp size={18} className="text-night-400 shrink-0" /> : <ChevronDown size={18} className="text-night-400 shrink-0" />}
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="p-5 space-y-3">
            {meal.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-start justify-between py-2.5 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="font-body font-medium text-sm text-white">{item.name}</p>
                  <p className="text-xs text-night-400 font-mono mt-0.5">{item.quantity}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs font-mono" style={{ color: '#c8ff00' }}>{item.calories} kcal</p>
                  <p className="text-xs font-mono text-night-400 mt-0.5">
                    P:{item.protein_g}g C:{item.carbs_g}g F:{item.fat_g}g
                  </p>
                </div>
              </div>
            ))}

            {meal.preparation_notes && (
              <div className="mt-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.1)' }}>
                <p className="text-xs font-body text-night-300 leading-relaxed">
                  📝 {meal.preparation_notes}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded shimmer" />
          <div className="h-3 w-48 rounded shimmer" />
        </div>
      </div>
    </div>
  )
}

export default function DietPlanPage() {
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['diet-plan'],
    queryFn: () => API.get('/plans/diet/active').then(r => r.data),
    retry: false,
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="text-3xl font-display font-bold">Diet Plan</h1>
        {plan && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <p className="text-night-400 font-body">{plan.title}</p>
            <span className="stat-pill"><Flame size={12} /> {plan.total_calories} kcal/day</span>
            <MacroBadge value={plan.protein_g} label="Protein" color="#00f5ff" />
            <MacroBadge value={plan.carbs_g} label="Carbs" color="#c8ff00" />
            <MacroBadge value={plan.fat_g} label="Fat" color="#ff3cac" />
          </div>
        )}
      </motion.div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {error && (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">🥗</p>
          <p className="font-display font-semibold text-lg mb-2">No diet plan yet</p>
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
          <div className="space-y-4">
            {plan.meals?.map((meal: any, i: number) => (
              <MealCard key={i} meal={meal} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
