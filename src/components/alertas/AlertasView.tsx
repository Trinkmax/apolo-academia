// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { AlertList } from './AlertList'
import { isPast, isToday, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Inbox,
  BookOpen,
  Filter,
  GraduationCap,
  User,
} from 'lucide-react'
import type { Alumno, Curso, MensajePlantilla } from '@/lib/supabase/types'

type EnrichedAlumno = {
  id: string
  nombre_completo: string
  telefono: string
  estado_pago?: string
  monto_pactado?: number
  total_abonado?: number
}

type AlertasViewProps = {
  alertas: any[]
  alumnos: Alumno[]
  cursos: Curso[]
  cursoAlumnosMap: Record<string, EnrichedAlumno[]>
  alumnoContextMap: Record<string, EnrichedAlumno>
  plantillas: MensajePlantilla[]
  stats: {
    paraHoy: number
    vencidas: number
    pendientes: number
    completadas: number
  }
}

type StatusFilter = 'pendientes' | 'hoy' | 'vencidas' | 'completadas'
type CursoFilter = 'todos' | 'manuales' | string // string = curso id

export function AlertasView({
  alertas,
  alumnos,
  cursos,
  cursoAlumnosMap,
  alumnoContextMap,
  plantillas,
  stats,
}: AlertasViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pendientes')
  const [cursoFilter, setCursoFilter] = useState<CursoFilter>('todos')

  // Cursos that have alerts linked to them
  const cursosConAlertas = useMemo(() => {
    const cursoIds = new Set(
      alertas.filter(a => a.tipo === 'curso').map(a => a.referencia_id)
    )
    return cursos.filter(c => cursoIds.has(c.id))
  }, [alertas, cursos])

  const hasManualAlerts = useMemo(() => {
    return alertas.some(a => a.tipo === 'alumno')
  }, [alertas])

  // Apply filters
  const filtered = useMemo(() => {
    let result = alertas

    // Status filter
    switch (statusFilter) {
      case 'pendientes':
        result = result.filter(a => !a.completada)
        break
      case 'hoy':
        result = result.filter(a => !a.completada && isToday(new Date(a.fecha_vencimiento)))
        break
      case 'vencidas':
        result = result.filter(a => !a.completada && isPast(new Date(a.fecha_vencimiento)) && !isToday(new Date(a.fecha_vencimiento)))
        break
      case 'completadas':
        result = result.filter(a => a.completada)
        break
    }

    // Curso filter
    if (cursoFilter === 'manuales') {
      result = result.filter(a => a.tipo === 'alumno')
    } else if (cursoFilter !== 'todos') {
      result = result.filter(a => a.tipo === 'curso' && a.referencia_id === cursoFilter)
    }

    return result
  }, [alertas, statusFilter, cursoFilter])

  // Group by curso for display
  const grouped = useMemo(() => {
    if (cursoFilter !== 'todos') return null // No grouping when filtered

    const groups: { cursoId: string | null; cursoNombre: string; alertas: any[] }[] = []
    const cursoMap = new Map<string, any[]>()
    const manualAlerts: any[] = []

    for (const a of filtered) {
      if (a.tipo === 'curso') {
        if (!cursoMap.has(a.referencia_id)) cursoMap.set(a.referencia_id, [])
        cursoMap.get(a.referencia_id)!.push(a)
      } else {
        manualAlerts.push(a)
      }
    }

    // Order curso groups by the curso order (fecha_inicio desc)
    for (const curso of cursos) {
      if (cursoMap.has(curso.id)) {
        groups.push({
          cursoId: curso.id,
          cursoNombre: curso.nombre,
          alertas: cursoMap.get(curso.id)!,
        })
      }
    }

    if (manualAlerts.length > 0) {
      groups.push({
        cursoId: null,
        cursoNombre: 'Tareas manuales',
        alertas: manualAlerts,
      })
    }

    return groups
  }, [filtered, cursoFilter, cursos])

  const statusButtons: { key: StatusFilter; label: string; count: number; icon: any; color: string }[] = [
    { key: 'pendientes', label: 'Pendientes', count: stats.pendientes, icon: Bell, color: 'text-amarillo' },
    { key: 'hoy', label: 'Hoy', count: stats.paraHoy, icon: Clock, color: 'text-primary' },
    { key: 'vencidas', label: 'Vencidas', count: stats.vencidas, icon: AlertTriangle, color: 'text-rojo' },
    { key: 'completadas', label: 'Resueltas', count: stats.completadas, icon: CheckCircle2, color: 'text-verde' },
  ]

  return (
    <div className="space-y-6">
      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {statusButtons.map(({ key, label, count, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap shrink-0 ${
              statusFilter === key
                ? 'bg-primary/10 border-primary/30 text-primary shadow-sm shadow-primary/10'
                : 'bg-card/50 border-border/40 text-muted-foreground hover:border-border/60 hover:text-foreground'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${statusFilter === key ? 'text-primary' : color}`} />
            {label}
            <span className={`tabular-nums px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              statusFilter === key
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/50 text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Curso filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <button
          onClick={() => setCursoFilter('todos')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
            cursoFilter === 'todos'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-card/50 border-border/40 text-muted-foreground hover:border-border/60 hover:text-foreground'
          }`}
        >
          Todos
        </button>
        {cursosConAlertas.map(c => (
          <button
            key={c.id}
            onClick={() => setCursoFilter(cursoFilter === c.id ? 'todos' : c.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              cursoFilter === c.id
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card/50 border-border/40 text-muted-foreground hover:border-border/60 hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            {c.nombre}
          </button>
        ))}
        {hasManualAlerts && (
          <button
            onClick={() => setCursoFilter(cursoFilter === 'manuales' ? 'todos' : 'manuales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              cursoFilter === 'manuales'
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card/50 border-border/40 text-muted-foreground hover:border-border/60 hover:text-foreground'
            }`}
          >
            <User className="w-3 h-3" />
            Manuales
          </button>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
          <Inbox className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            {statusFilter === 'completadas'
              ? 'No hay tareas resueltas'
              : statusFilter === 'hoy'
              ? 'No hay tareas para hoy'
              : statusFilter === 'vencidas'
              ? 'No hay tareas vencidas'
              : 'No hay tareas pendientes'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {statusFilter === 'pendientes' ? 'Estas al dia con todo.' : 'Prueba cambiando los filtros.'}
          </p>
        </div>
      ) : grouped ? (
        // Grouped by curso
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.cursoId || 'manual'}>
              {/* Group header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  group.cursoId ? 'bg-primary/10' : 'bg-amarillo/10'
                }`}>
                  {group.cursoId ? (
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-amarillo" />
                  )}
                </div>
                <h2 className="text-sm font-bold">{group.cursoNombre}</h2>
                <span className="text-[10px] text-muted-foreground tabular-nums bg-muted/30 px-1.5 py-0.5 rounded">
                  {group.alertas.length}
                </span>
                {group.cursoId && (
                  <button
                    onClick={() => setCursoFilter(group.cursoId!)}
                    className="ml-auto text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Ver solo este curso
                  </button>
                )}
              </div>
              <AlertList
                alertas={group.alertas}
                alumnos={alumnos}
                cursos={cursos}
                cursoAlumnosMap={cursoAlumnosMap}
                alumnoContextMap={alumnoContextMap}
                plantillas={plantillas}
              />
            </div>
          ))}
        </div>
      ) : (
        // Flat list (filtered by specific curso)
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              {cursoFilter === 'manuales' ? (
                <User className="w-3.5 h-3.5 text-primary" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <h2 className="text-sm font-bold">
              {cursoFilter === 'manuales'
                ? 'Tareas manuales'
                : cursos.find(c => c.id === cursoFilter)?.nombre || 'Alertas'}
            </h2>
            <span className="text-[10px] text-muted-foreground tabular-nums bg-muted/30 px-1.5 py-0.5 rounded">
              {filtered.length} tarea{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <AlertList
            alertas={filtered}
            alumnos={alumnos}
            cursos={cursos}
            cursoAlumnosMap={cursoAlumnosMap}
            alumnoContextMap={alumnoContextMap}
            plantillas={plantillas}
          />
        </div>
      )}
    </div>
  )
}
