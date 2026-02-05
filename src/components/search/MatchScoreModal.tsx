'use client'

import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Sparkles, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatchScoreModalProps {
  isOpen: boolean
  onClose: () => void
  propertyTitle: string
  matchScore: number
  matchReasons: string[]
  /** Optional: price to display */
  price?: number
  /** Optional: city/location */
  city?: string
}

export function MatchScoreModal({
  isOpen,
  onClose,
  propertyTitle,
  matchScore,
  matchReasons,
  price,
  city,
}: MatchScoreModalProps) {
  // Determine score category for styling
  const getScoreCategory = (score: number) => {
    if (score >= 90) return { label: 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-100', progressColor: 'bg-emerald-500' }
    if (score >= 75) return { label: 'Muy bueno', color: 'text-teal-600', bg: 'bg-teal-100', progressColor: 'bg-teal-500' }
    if (score >= 60) return { label: 'Bueno', color: 'text-amber-600', bg: 'bg-amber-100', progressColor: 'bg-amber-500' }
    return { label: 'Regular', color: 'text-slate-600', bg: 'bg-slate-100', progressColor: 'bg-slate-500' }
  }

  const category = getScoreCategory(matchScore)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          {/* Score Circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="relative mx-auto"
          >
            <div className={cn(
              "h-24 w-24 rounded-full flex items-center justify-center",
              category.bg
            )}>
              <div className="text-center">
                <span className={cn("text-3xl font-bold", category.color)}>
                  {matchScore}%
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className={cn("gap-1", category.bg, category.color, "border-0")}>
                <Target className="h-3 w-3" />
                {category.label}
              </Badge>
            </div>
          </motion.div>

          <div className="space-y-1 pt-4">
            <DialogTitle className="text-lg font-bold text-slate-900 line-clamp-2">
              {propertyTitle}
            </DialogTitle>
            {(city || price) && (
              <DialogDescription className="text-slate-500">
                {city && <span>{city}</span>}
                {city && price && <span> · </span>}
                {price && <span className="font-medium">${price.toLocaleString('en-US')}</span>}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Compatibility Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Compatibilidad con tu estilo de vida
              </span>
              <span className={cn("font-semibold", category.color)}>{matchScore}%</span>
            </div>
            <Progress value={matchScore} className="h-2" />
          </div>

          {/* Match Reasons */}
          {matchReasons.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Por qué esta propiedad encaja contigo
              </h4>
              <ul className="space-y-2.5">
                {matchReasons.map((reason, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanation note */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
            <p>
              Este puntaje se calcula analizando cómo la propiedad se alinea con 
              tus preferencias de estilo de vida, ubicación, presupuesto y prioridades 
              que describiste en tu búsqueda.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MatchScoreModal
