// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Minus, Loader2, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type CourseClassProgressProps = {
  cursoId: string
  claseDates: string[] | null
  clasesCompletadas: boolean[] | null
}

export function CourseClassProgress({
  cursoId,
  claseDates,
  clasesCompletadas: initialCompletadas,
}: CourseClassProgressProps) {
  const router = useRouter()
  const supabase = createClient()
  const dates = claseDates || []
  const [completadas, setCompletadas] = useState<boolean[]>(
    initialCompletadas || dates.map(() => false)
  )
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)

  const completedCount = completadas.filter(Boolean).length

  async function toggleClase(index: number) {
    setLoadingIdx(index)
    try {
      const updated = [...completadas]
      updated[index] = !updated[index]
      setCompletadas(updated)

      await supabase
        .from('cursos')
        .update({ clases_completadas: updated })
        .eq('id', cursoId)

      router.refresh()
    } finally {
      setLoadingIdx(null)
    }
  }

  if (dates.length === 0) return null

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
          <BookOpen className="w-3 h-3 text-primary" />
          Clases ({completedCount}/{dates.length})
        </h4>
      </div>
      <div className="flex gap-1.5">
        {dates.map((fecha, i) => {
          const done = completadas[i] ?? false
          const isLoading = loadingIdx === i

          return (
            <button
              key={fecha}
              onClick={() => toggleClase(i)}
              disabled={isLoading}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg border transition-all"
              style={done ? {
                background: 'hsl(var(--verde) / 0.1)',
                borderColor: 'hsl(var(--verde) / 0.25)',
              } : {
                background: 'hsl(var(--card) / 0.5)',
                borderColor: 'hsl(var(--border) / 0.3)',
              }}
            >
              <span className="text-[8px] font-bold text-muted-foreground">C{i + 1}</span>
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={
                  isLoading ? { opacity: 0.4 } :
                  done ? { background: 'hsl(var(--verde) / 0.2)', color: 'hsl(var(--verde))' } :
                  { background: 'hsl(var(--muted) / 0.3)', color: 'hsl(var(--muted-foreground) / 0.25)' }
                }
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                 done ? <Check className="w-3 h-3" /> :
                 <Minus className="w-2.5 h-2.5" />}
              </div>
              <span className="text-[8px] tabular-nums text-muted-foreground">
                {format(new Date(fecha + 'T12:00:00'), 'dd/MM', { locale: es })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
