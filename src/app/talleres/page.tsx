import { createClient } from '@/lib/supabase/server'
import { TalleresPanel } from '@/components/talleres/TalleresPanel'
import { Scissors } from 'lucide-react'

export default async function TalleresPage() {
  const supabase = await createClient()

  const [
    { data: talleres, error: tErr },
    { data: alumnos, error: aErr },
  ] = await Promise.all([
    supabase
      .from('talleres_practica')
      .select('*, alumnos(id, nombre_completo, telefono, talleres_realizados)')
      .order('fecha', { ascending: false }),
    supabase
      .from('alumnos')
      .select('id, nombre_completo, telefono')
      .order('nombre_completo'),
  ])

  if (tErr || aErr) {
    return (
      <div className="p-6 rounded-xl" style={{ background: 'hsl(var(--rojo) / 0.05)', border: '1px solid hsl(var(--rojo) / 0.2)' }}>
        <h3 className="font-bold" style={{ color: 'hsl(var(--rojo))' }}>Error cargando talleres</h3>
        <code className="text-xs bg-black/50 p-2 mt-2 rounded block whitespace-pre-wrap">{JSON.stringify(tErr || aErr, null, 2)}</code>
      </div>
    )
  }

  // Stats
  const total = talleres?.length || 0
  const asistidos = talleres?.filter((t: any) => t.asistio).length || 0
  const pagados = talleres?.filter((t: any) => t.pagado).length || 0
  const pendientesPago = talleres?.filter((t: any) => !t.pagado).length || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talleres de Practica</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Gestiona talleres, marca asistencia y pagos.</p>
        <div className="header-accent mt-4 w-24" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <p className="text-2xl font-bold tabular-nums">{total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total talleres</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'linear-gradient(135deg, hsl(var(--verde) / 0.06) 0%, hsl(var(--card)) 100%)', borderColor: 'hsl(var(--verde) / 0.15)' }}>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'hsl(var(--verde))' }}>{asistidos}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Asistidos</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 100%)', borderColor: 'hsl(var(--primary) / 0.15)' }}>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'hsl(var(--primary))' }}>{pagados}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pagados</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'linear-gradient(135deg, hsl(var(--rojo) / 0.06) 0%, hsl(var(--card)) 100%)', borderColor: 'hsl(var(--rojo) / 0.15)' }}>
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'hsl(var(--rojo))' }}>{pendientesPago}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Deben pago</p>
        </div>
      </div>

      <TalleresPanel talleres={talleres || []} alumnos={alumnos || []} />
    </div>
  )
}
