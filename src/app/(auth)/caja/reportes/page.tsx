import { createClient } from '@/lib/supabase/server'
import { BarChart3 } from 'lucide-react'
import { ReportesView } from '@/components/caja/ReportesView'

export default async function ReportesPage() {
  const supabase = await createClient()

  // Fetch all movements
  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select('*')
    .order('fecha', { ascending: false })

  // Fetch all gastos with categories
  const { data: gastos } = await supabase
    .from('gastos')
    .select('*, categorias_gasto(nombre, icono, color, tipo)')
    .order('fecha', { ascending: false })

  // Fetch categories
  const { data: categorias } = await supabase
    .from('categorias_gasto')
    .select('*')
    .eq('activa', true)
    .order('orden')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reportes</h1>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">Analisis</span>
        </div>
        <p className="text-muted-foreground text-sm">Analisis financiero, flujo de caja y desglose de gastos.</p>
        <div className="header-accent mt-4 w-24" />
      </div>

      <ReportesView
        movimientos={movimientos || []}
        gastos={gastos || []}
        categorias={categorias || []}
      />
    </div>
  )
}
