import { createClient } from '@/lib/supabase/server'
import { CreateAlertForm } from '@/components/alertas/CreateAlertForm'
import { AlertList } from '@/components/alertas/AlertList'
import { Bell, CheckCircle2, AlertTriangle, Clock, Inbox } from 'lucide-react'
import { isPast, isToday } from 'date-fns'

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
    supabase.from('cursos').select('*'),
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

  // Build cursoAlumnosMap with enriched data (payment status)
  const cursoAlumnosMap: Record<string, { id: string; nombre_completo: string; telefono: string; estado_pago?: string; monto_pactado?: number; total_abonado?: number }[]> = {}

  // Build alumnoContextMap - enriched student data for individual alerts
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

    // Curso map
    const cursoId = ins.curso_id
    if (!cursoAlumnosMap[cursoId]) cursoAlumnosMap[cursoId] = []
    if (!cursoAlumnosMap[cursoId].find((a: any) => a.id === ins.alumnos.id)) {
      cursoAlumnosMap[cursoId].push(enriched)
    }

    // Alumno context map (keep the one with most debt for alerting)
    const existing = alumnoContextMap[ins.alumnos.id]
    if (!existing || (ins.monto_pactado - totalAbonado) > ((existing.monto_pactado || 0) - (existing.total_abonado || 0))) {
      alumnoContextMap[ins.alumnos.id] = enriched
    }
  })

  // Also add basic alumno info for students without inscriptions
  alumnos?.forEach((a: any) => {
    if (!alumnoContextMap[a.id]) {
      alumnoContextMap[a.id] = {
        id: a.id,
        nombre_completo: a.nombre_completo,
        telefono: a.telefono,
      }
    }
  })

  const pendientes = alertas?.filter(a => !a.completada) || []
  const completadas = alertas?.filter(a => a.completada) || []
  const vencidas = pendientes.filter(a => isPast(new Date(a.fecha_vencimiento)) && !isToday(new Date(a.fecha_vencimiento)))
  const paraHoy = pendientes.filter(a => isToday(new Date(a.fecha_vencimiento)))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Alertas</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Tareas del dia, recordatorios y mensajeria CRM integrada.</p>
          <div className="header-accent mt-4 w-24" />
        </div>
        <CreateAlertForm cursos={cursos || []} alumnos={alumnos || []} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amarillo/5 border border-amarillo/15">
          <Clock className="w-4 h-4 text-amarillo" />
          <div>
            <p className="text-lg font-bold text-amarillo tabular-nums">{paraHoy.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Para hoy</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rojo/5 border border-rojo/15">
          <AlertTriangle className="w-4 h-4 text-rojo" />
          <div>
            <p className="text-lg font-bold text-rojo tabular-nums">{vencidas.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Vencidas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-verde/5 border border-verde/15">
          <CheckCircle2 className="w-4 h-4 text-verde" />
          <div>
            <p className="text-lg font-bold text-verde tabular-nums">{completadas.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Resueltas</p>
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Pending */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-amarillo/10 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-amarillo" />
            </div>
            <h2 className="text-base font-bold">Pendientes</h2>
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">{pendientes.length} tareas</span>
          </div>
          {pendientes.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
              <Inbox className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Tu bandeja esta vacia</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Estas al dia con todas tus tareas.</p>
            </div>
          ) : (
            <AlertList
              alertas={pendientes}
              alumnos={alumnos || []}
              cursos={cursos || []}
              cursoAlumnosMap={cursoAlumnosMap}
              alumnoContextMap={alumnoContextMap}
              plantillas={plantillas || []}
            />
          )}
        </div>

        {/* Completed */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-verde/10 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-verde" />
            </div>
            <h2 className="text-base font-bold text-muted-foreground">Completadas</h2>
          </div>
          {completadas.length === 0 ? (
            <p className="text-muted-foreground/60 italic text-xs p-4 text-center">
              No hay tareas completadas.
            </p>
          ) : (
            <AlertList
              alertas={completadas.slice(0, 5)}
              alumnos={alumnos || []}
              cursos={cursos || []}
              cursoAlumnosMap={cursoAlumnosMap}
              alumnoContextMap={alumnoContextMap}
              plantillas={plantillas || []}
            />
          )}
        </div>
      </div>
    </div>
  )
}
