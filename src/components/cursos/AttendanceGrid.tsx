'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Check, X, Loader2, PlusCircle, CalendarPlus } from 'lucide-react'
import type { InscripcionConDetalles, Asistencia } from '@/lib/supabase/types'
import { format } from 'date-fns'

export function AttendanceGrid({
  cursoId,
  inscripciones,
  asistenciasHistoricas
}: {
  cursoId: string,
  inscripciones: any[],
  asistenciasHistoricas: Asistencia[]
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [nuevaFecha, setNuevaFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [creando, setCreando] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const fechasSet = new Set(asistenciasHistoricas.map(a => a.fecha_clase))
  const fechasClase = Array.from(fechasSet).sort()

  const toggleAsistencia = async (inscripcionId: string, fecha: string, estadoActual: boolean | null) => {
    const targetKey = `${inscripcionId}-${fecha}`
    setLoading(targetKey)
    try {
      if (estadoActual === null) {
        await supabase.from('asistencias').insert([{ inscripcion_id: inscripcionId, fecha_clase: fecha, presente: true }])
      } else {
        await supabase.from('asistencias')
          .update({ presente: !estadoActual })
          .match({ inscripcion_id: inscripcionId, fecha_clase: fecha })
      }
      router.refresh()
    } catch (err: any) {
      toast.error('Error al guardar asistencia')
    } finally {
      setLoading(null)
    }
  }

  const crearNuevaClase = async () => {
    if (!nuevaFecha) return
    if (fechasClase.includes(nuevaFecha)) {
      toast.error('La fecha ya existe')
      return
    }

    setCreando(true)
    try {
      const nuevasAsistencias = inscripciones.map(ins => ({
        inscripcion_id: ins.id,
        fecha_clase: nuevaFecha,
        presente: false
      }))

      if (nuevasAsistencias.length > 0) {
        await supabase.from('asistencias').insert(nuevasAsistencias)
      }

      toast.success('Nueva clase agregada a la grilla')
      router.refresh()
    } catch (err) {
      toast.error('Error al crear clase')
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Add class toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-card/50">
          <CalendarPlus className="w-4 h-4 text-primary" />
          <Input
            type="date"
            value={nuevaFecha}
            onChange={e => setNuevaFecha(e.target.value)}
            className="w-36 bg-transparent border-0 h-7 p-0 text-sm focus-visible:ring-0"
          />
        </div>
        <Button onClick={crearNuevaClase} disabled={creando || inscripciones.length === 0} variant="secondary" className="h-9 text-xs font-semibold">
          {creando ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <PlusCircle className="w-3.5 h-3.5 mr-1.5" />}
          Agregar Clase
        </Button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-verde/15 border border-verde/30 flex items-center justify-center"><Check className="w-3 h-3 text-verde" /></span>
            Presente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-rojo/10 border border-rojo/20 flex items-center justify-center"><X className="w-3 h-3 text-rojo" /></span>
            Ausente
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-border/40 overflow-x-auto bg-card/30">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="border-b border-border/40" style={{ background: 'hsl(var(--surface-2) / 0.5)' }}>
              <th className="px-5 py-3 text-left sticky left-0 bg-card z-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border)/0.3)]">
                Alumno
              </th>
              {fechasClase.map(fecha => (
                <th key={fecha} className="px-3 py-3 font-semibold min-w-[72px] border-l border-border/30 text-[11px] text-muted-foreground">
                  {format(new Date(fecha), 'dd/MM')}
                </th>
              ))}
              {fechasClase.length === 0 && (
                <th className="px-4 py-3 text-muted-foreground/50 font-normal text-xs border-l border-border/30">Sin clases aun</th>
              )}
            </tr>
          </thead>
          <tbody>
            {inscripciones.length === 0 ? (
              <tr>
                <td colSpan={fechasClase.length + 1} className="p-12 text-muted-foreground/60 text-xs">
                  No hay alumnos inscritos en este curso.
                </td>
              </tr>
            ) : (
              inscripciones.map((ins, idx) => (
                <tr key={ins.id} className={`table-row-hover ${idx < inscripciones.length - 1 ? 'border-b border-border/20' : ''}`}>
                  <td className="px-5 py-3 text-left font-medium text-[13px] sticky left-0 bg-card z-10 shadow-[1px_0_0_0_hsl(var(--border)/0.3)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {ins.alumnos.nombre_completo?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="truncate max-w-[140px]">{ins.alumnos.nombre_completo}</span>
                    </div>
                  </td>

                  {fechasClase.map(fecha => {
                    const asis = asistenciasHistoricas.find(a => a.inscripcion_id === ins.id && a.fecha_clase === fecha)
                    const presente = asis?.presente ?? null
                    const loadingKey = `${ins.id}-${fecha}`

                    return (
                      <td key={fecha} className="px-3 py-2 border-l border-border/20 text-center">
                        <button
                          disabled={loading === loadingKey}
                          onClick={() => toggleAsistencia(ins.id, fecha, presente)}
                          className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 border ${
                            loading === loadingKey ? 'opacity-40' :
                            presente === true ? 'bg-verde/15 border-verde/30 text-verde hover:bg-verde/25' :
                            presente === false ? 'bg-rojo/10 border-rojo/20 text-rojo hover:bg-rojo/20' :
                            'bg-transparent border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 text-transparent'
                          }`}
                        >
                          {loading === loadingKey ? <Loader2 className="w-3 h-3 animate-spin" /> :
                           presente === true ? <Check className="w-3.5 h-3.5" /> :
                           presente === false ? <X className="w-3.5 h-3.5" /> :
                           <span className="text-muted-foreground/30 text-[10px]">-</span>}
                        </button>
                      </td>
                    )
                  })}
                  {fechasClase.length === 0 && <td className="border-l border-border/20"></td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
