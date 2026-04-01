// @ts-nocheck
'use client'

import { useState } from 'react'
import { AlertCompleteButton } from './AlertCompleteButton'
import { AlertActionDialog } from './AlertActionDialog'
import { format, isPast, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  User,
  BookOpen,
  CalendarClock,
  Clock,
  AlertTriangle,
  MessageCircle,
  ChevronRight,
  DollarSign,
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

type AlertListProps = {
  alertas: any[]
  alumnos: Alumno[]
  cursos: Curso[]
  cursoAlumnosMap: Record<string, EnrichedAlumno[]>
  alumnoContextMap: Record<string, EnrichedAlumno>
  plantillas: MensajePlantilla[]
}

export function AlertList({ alertas, alumnos, cursos, cursoAlumnosMap, alumnoContextMap, plantillas }: AlertListProps) {
  const [activeAlerta, setActiveAlerta] = useState<any | null>(null)

  function getRefName(tipo: string, id: string) {
    if (tipo === 'alumno') {
      const a = alumnos.find(al => al.id === id)
      return a ? a.nombre_completo : 'Desconocido'
    } else {
      const c = cursos.find(co => co.id === id)
      return c ? c.nombre : 'Curso Desconocido'
    }
  }

  function getAlumnoEnriched(id: string): EnrichedAlumno | null {
    return alumnoContextMap[id] || null
  }

  function getCurso(id: string): Curso | null {
    return cursos.find(c => c.id === id) || null
  }

  function getColorAccent(color: string, completada: boolean) {
    if (completada) return { border: 'border-l-verde', bg: 'bg-verde/3' }
    switch (color) {
      case 'rojo': return { border: 'border-l-rojo', bg: 'bg-rojo/3' }
      case 'naranja': return { border: 'border-l-orange-500', bg: 'bg-orange-500/3' }
      default: return { border: 'border-l-blue-500', bg: 'bg-blue-500/3' }
    }
  }

  function renderAlertItem(a: any) {
    const isVencida = isPast(new Date(a.fecha_vencimiento)) && !isToday(new Date(a.fecha_vencimiento))
    const isHoy = isToday(new Date(a.fecha_vencimiento))
    const accent = getColorAccent(a.color_etiqueta, a.completada)
    const refName = getRefName(a.tipo, a.referencia_id)

    // Quick CRM context for alumno alerts
    const alumnoCtx = a.tipo === 'alumno' ? alumnoContextMap[a.referencia_id] : null
    const showDeuda = alumnoCtx && alumnoCtx.monto_pactado && alumnoCtx.total_abonado != null &&
      (alumnoCtx.monto_pactado - alumnoCtx.total_abonado) > 0

    return (
      <div
        key={a.id}
        className={`rounded-xl border border-border/40 ${accent.bg} border-l-[3px] ${accent.border} ${a.completada ? 'opacity-50' : ''} transition-all hover:border-border/60 group`}
      >
        <div className="p-4 flex items-start gap-3.5">
          <AlertCompleteButton id={a.id} completada={a.completada} />

          <button
            type="button"
            onClick={() => !a.completada && setActiveAlerta(a)}
            className={`flex-1 min-w-0 text-left ${!a.completada ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={a.completada}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-[15px] leading-snug ${a.completada ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                  {a.descripcion}
                </h3>

                <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                    {a.tipo === 'alumno' ? <User className="w-3 h-3 text-primary" /> : <BookOpen className="w-3 h-3 text-primary" />}
                    {refName}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="w-3 h-3" />
                    {format(new Date(a.fecha_vencimiento), "d 'de' MMMM", { locale: es })}
                  </span>
                  {/* Inline debt indicator */}
                  {!a.completada && showDeuda && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rojo">
                      <DollarSign className="w-2.5 h-2.5" />
                      Debe ${(alumnoCtx.monto_pactado - alumnoCtx.total_abonado).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!a.completada && (
                  <>
                    {isHoy && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-amarillo/15 text-amarillo border border-amarillo/20">
                        <Clock className="w-2.5 h-2.5" /> HOY
                      </span>
                    )}
                    {isVencida && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-rojo/15 text-rojo border border-rojo/20">
                        <AlertTriangle className="w-2.5 h-2.5" /> VENCIDA
                      </span>
                    )}
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-muted/30">
                      <MessageCircle className="w-2.5 h-2.5" /> Actuar
                      <ChevronRight className="w-2.5 h-2.5" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2.5">
        {alertas.map(renderAlertItem)}
      </div>

      {activeAlerta && (
        <AlertActionDialog
          open={!!activeAlerta}
          onOpenChange={(open) => { if (!open) setActiveAlerta(null) }}
          alerta={activeAlerta}
          refName={getRefName(activeAlerta.tipo, activeAlerta.referencia_id)}
          alumno={activeAlerta.tipo === 'alumno' ? getAlumnoEnriched(activeAlerta.referencia_id) : null}
          curso={activeAlerta.tipo === 'curso' ? getCurso(activeAlerta.referencia_id) : null}
          alumnosCurso={
            activeAlerta.tipo === 'curso'
              ? (cursoAlumnosMap[activeAlerta.referencia_id] || [])
              : []
          }
          plantillas={plantillas}
        />
      )}
    </>
  )
}
