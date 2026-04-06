// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Minus, Loader2, BookOpen, Pencil } from 'lucide-react'
import { format, isPast, parseISO, startOfDay } from 'date-fns'
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
  const [currentDates, setCurrentDates] = useState<string[]>(dates)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editDate, setEditDate] = useState('')
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoSyncDone = useRef(false)

  // Auto-complete classes whose date has passed
  useEffect(() => {
    if (autoSyncDone.current || currentDates.length === 0) return
    autoSyncDone.current = true

    const today = startOfDay(new Date())
    const updated = [...completadas]
    let changed = false

    currentDates.forEach((fecha, i) => {
      const classDate = startOfDay(parseISO(fecha))
      if (isPast(classDate) && classDate < today && !updated[i]) {
        updated[i] = true
        changed = true
      }
    })

    if (changed) {
      setCompletadas(updated)
      supabase
        .from('cursos')
        .update({ clases_completadas: updated })
        .eq('id', cursoId)
        .then(() => router.refresh())
    }
  }, [currentDates])

  // Focus input when editing
  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingIdx])

  function startEditDate(index: number) {
    setEditingIdx(index)
    setEditDate(currentDates[index])
  }

  async function saveDate(index: number) {
    if (!editDate || editDate === currentDates[index]) {
      setEditingIdx(null)
      return
    }
    setLoadingIdx(index)
    try {
      const newDates = [...currentDates]
      newDates[index] = editDate
      setCurrentDates(newDates)

      // Recalculate completadas based on new dates
      const today = startOfDay(new Date())
      const newCompletadas = newDates.map((fecha) => {
        const classDate = startOfDay(parseISO(fecha))
        return isPast(classDate) && classDate < today
      })
      setCompletadas(newCompletadas)

      await supabase
        .from('cursos')
        .update({
          clase_dates: newDates,
          clases_completadas: newCompletadas,
        })
        .eq('id', cursoId)

      router.refresh()
    } finally {
      setLoadingIdx(null)
      setEditingIdx(null)
    }
  }

  const completedCount = completadas.filter(Boolean).length

  if (currentDates.length === 0) return null

  return (
    <div className="px-3 sm:px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
          <BookOpen className="w-3 h-3 text-primary" />
          Clases ({completedCount}/{currentDates.length})
        </h4>
      </div>
      <div className="flex gap-1.5">
        {currentDates.map((fecha, i) => {
          const done = completadas[i] ?? false
          const isLoading = loadingIdx === i
          const isEditing = editingIdx === i

          return (
            <div key={`${fecha}-${i}`} className="flex-1 flex flex-col items-center">
              {isEditing ? (
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="text-[8px] font-bold text-primary">C{i + 1}</span>
                  <input
                    ref={inputRef}
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    onBlur={() => saveDate(i)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveDate(i)
                      if (e.key === 'Escape') setEditingIdx(null)
                    }}
                    className="w-full text-[9px] bg-background border rounded-md px-1 py-1 text-center tabular-nums"
                    style={{ borderColor: 'hsl(var(--primary) / 0.4)' }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => startEditDate(i)}
                  disabled={isLoading}
                  className="w-full flex flex-col items-center gap-1 py-1.5 rounded-lg border transition-all group"
                  style={done ? {
                    background: 'hsl(var(--verde) / 0.1)',
                    borderColor: 'hsl(var(--verde) / 0.25)',
                  } : {
                    background: 'hsl(var(--card) / 0.5)',
                    borderColor: 'hsl(var(--border) / 0.3)',
                  }}
                  title="Click para editar fecha"
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
                     <Minus className="w-2.5 h-2.5 group-hover:hidden" />}
                    {!isLoading && !done && (
                      <Pencil className="w-2.5 h-2.5 hidden group-hover:block" style={{ color: 'hsl(var(--primary))' }} />
                    )}
                  </div>
                  <span className="text-[8px] tabular-nums text-muted-foreground">
                    {format(new Date(fecha + 'T12:00:00'), 'dd/MM', { locale: es })}
                  </span>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
