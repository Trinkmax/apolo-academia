import { createClient } from '@/lib/supabase/server'
import { Landmark } from 'lucide-react'
import { CajaOverview } from '@/components/caja/CajaOverview'

export default async function CajaPage() {
  const supabase = await createClient()

  // Fetch open session
  const { data: sesionAbierta } = await supabase
    .from('sesiones_caja')
    .select('*')
    .eq('estado', 'ABIERTA')
    .maybeSingle()

  // Fetch today's movements
  const hoy = new Date().toISOString().split('T')[0]
  const { data: movimientosHoy } = await supabase
    .from('movimientos_caja')
    .select('*')
    .gte('fecha', hoy)
    .order('creado_en', { ascending: false })

  // Fetch this month's movements for summary
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const { data: movimientosMes } = await supabase
    .from('movimientos_caja')
    .select('*')
    .gte('fecha', inicioMes)
    .order('creado_en', { ascending: false })

  // Fetch recent gastos
  const { data: gastosRecientes } = await supabase
    .from('gastos')
    .select('*, categorias_gasto(nombre, icono, color)')
    .order('fecha', { ascending: false })
    .limit(10)

  // Fetch categories
  const { data: categorias } = await supabase
    .from('categorias_gasto')
    .select('*')
    .eq('activa', true)
    .order('orden')

  // Calculate stats
  const ingresosHoy = movimientosHoy?.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + Number(m.monto), 0) || 0
  const egresosHoy = movimientosHoy?.filter(m => m.tipo === 'EGRESO').reduce((sum, m) => sum + Number(m.monto), 0) || 0
  const ingresosMes = movimientosMes?.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + Number(m.monto), 0) || 0
  const egresosMes = movimientosMes?.filter(m => m.tipo === 'EGRESO').reduce((sum, m) => sum + Number(m.monto), 0) || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Caja</h1>
          {sesionAbierta ? (
            <span className="text-xs font-medium text-verde bg-verde/10 border border-verde/20 px-2 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-verde animate-pulse" />
              Abierta
            </span>
          ) : (
            <span className="text-xs font-medium text-rojo bg-rojo/10 border border-rojo/20 px-2 py-0.5 rounded-md">
              Cerrada
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">Control de ingresos, egresos y arqueo de caja.</p>
        <div className="header-accent mt-4 w-24" />
      </div>

      <CajaOverview
        sesionAbierta={sesionAbierta}
        movimientosHoy={movimientosHoy || []}
        ingresosHoy={ingresosHoy}
        egresosHoy={egresosHoy}
        ingresosMes={ingresosMes}
        egresosMes={egresosMes}
        gastosRecientes={gastosRecientes || []}
        categorias={categorias || []}
      />
    </div>
  )
}
