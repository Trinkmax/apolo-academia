import { createClient } from '@/lib/supabase/server'
import { CreateAlertForm } from '@/components/alertas/CreateAlertForm'
import { AlertasView } from '@/components/alertas/AlertasView'
import { isPast, isToday } from 'date-fns'
import Link from 'next/link'
import { Settings } from 'lucide-react'

export default async function AlertasPage() {
  const supabase = await createClient()

  const [
    { data: alertas, error },
    { data: alumnos },
    { data: cursos },
    { data: inscripciones },
    { data: plantillas },
    { data: pagosData },
  ] = await Promise.all([
    supabase.from('alertas').select('*').order('fecha_vencimiento', { ascending: true }),
    supabase.from('alumnos').select('*'),
    supabase.from('cursos').select('*').order('fecha_inicio', { ascending: false }),
    supabase.from('curso_inscripciones').select(`
      id,
      curso_id,
      alumno_id,
      estado_pago,
      monto_pactado,
      alumnos ( id, nombre_completo, telefono )
    `),
    supabase.from('mensaje_plantillas').select('*').eq('activa', true).order('categoria'),
    supabase.from('pagos').select('inscripcion_id, monto'),
  ])

  if (error) {
    console.error('Error fetching alertas:', error)
  }

  // Build payment totals per inscription
  const pagosPorInscripcion: Record<string, number> = {}
  pagosData?.forEach((p: any) => {
    pagosPorInscripcion[p.inscripcion_id] = (pagosPorInscripcion[p.inscripcion_id] || 0) + p.monto
  })

  // Build cursoAlumnosMap with enriched data
  const cursoAlumnosMap: Record<string, { id: string; nombre_completo: string; telefono: string; estado_pago?: string; monto_pactado?: number; total_abonado?: number }[]> = {}
  const alumnoContextMap: Record<string, { id: string; nombre_completo: string; telefono: string; estado_pago?: string; monto_pactado?: number; total_abonado?: number }> = {}

  inscripciones?.forEach((ins: any) => {
    if (!ins.alumnos) return
    const totalAbonado = pagosPorInscripcion[ins.id] || 0
    const enriched = {
      id: ins.alumnos.id,
      nombre_completo: ins.alumnos.nombre_completo,
      telefono: ins.alumnos.telefono,
      estado_pago: ins.estado_pago,
      monto_pactado: ins.monto_pactado,
      total_abonado: totalAbonado,
    }
    const cursoId = ins.curso_id
    if (!cursoAlumnosMap[cursoId]) cursoAlumnosMap[cursoId] = []
    if (!cursoAlumnosMap[cursoId].find((a: any) => a.id === ins.alumnos.id)) {
      cursoAlumnosMap[cursoId].push(enriched)
    }
    const existing = alumnoContextMap[ins.alumnos.id]
    if (!existing || (ins.monto_pactado - totalAbonado) > ((existing.monto_pactado || 0) - (existing.total_abonado || 0))) {
      alumnoContextMap[ins.alumnos.id] = enriched
    }
  })

  alumnos?.forEach((a: any) => {
    if (!alumnoContextMap[a.id]) {
      alumnoContextMap[a.id] = { id: a.id, nombre_completo: a.nombre_completo, telefono: a.telefono }
    }
  })

  // Pre-compute stats
  const pendientes = alertas?.filter(a => !a.completada) || []
  const completadas = alertas?.filter(a => a.completada) || []
  const vencidas = pendientes.filter(a => isPast(new Date(a.fecha_vencimiento)) && !isToday(new Date(a.fecha_vencimiento)))
  const paraHoy = pendientes.filter(a => isToday(new Date(a.fecha_vencimiento)))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Centro de Alertas</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Tareas del dia, recordatorios y mensajeria CRM integrada.</p>
          <div className="header-accent mt-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/alertas/plantillas"
            className="h-9 px-3 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all text-xs font-semibold border border-border/40 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Plantillas
          </Link>
          <CreateAlertForm cursos={cursos || []} alumnos={alumnos || []} />
        </div>
      </div>

      {/* Client-side filterable view */}
      <AlertasView
        alertas={alertas || []}
        alumnos={alumnos || []}
        cursos={cursos || []}
        cursoAlumnosMap={cursoAlumnosMap}
        alumnoContextMap={alumnoContextMap}
        plantillas={plantillas || []}
        stats={{
          paraHoy: paraHoy.length,
          vencidas: vencidas.length,
          pendientes: pendientes.length,
          completadas: completadas.length,
        }}
      />
    </div>
  )
}
