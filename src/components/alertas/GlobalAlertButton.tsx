// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AlertFormFields } from './AlertFormFields'
import { BellPlus } from 'lucide-react'
import type { Alumno, Curso } from '@/lib/supabase/types'

export function GlobalAlertButton() {
  const [open, setOpen] = useState(false)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loaded, setLoaded] = useState(false)

  const supabase = createClient()

  // Fetch data when dialog opens
  useEffect(() => {
    if (!open || loaded) return

    async function fetchData() {
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from('alumnos').select('*').order('nombre_completo'),
        supabase.from('cursos').select('*').order('fecha_inicio', { ascending: false }),
      ])
      setAlumnos(a || [])
      setCursos(c || [])
      setLoaded(true)
    }
    fetchData()
  }, [open, loaded])

  // Keyboard shortcut: Ctrl/Cmd + J
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center group"
        title="Nueva alerta rapida (Ctrl+J)"
      >
        <BellPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px] glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg">Alerta Rapida</DialogTitle>
            <DialogDescription className="text-xs">Crea una alerta desde cualquier parte del sistema.</DialogDescription>
          </DialogHeader>
          <AlertFormFields
            alumnos={alumnos}
            cursos={cursos}
            onSuccess={() => { setOpen(false); setLoaded(false) }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
