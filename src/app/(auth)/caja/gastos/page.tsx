import { createClient } from '@/lib/supabase/server'
import { Receipt } from 'lucide-react'
import { GastosPanel } from '@/components/caja/GastosPanel'

export default async function GastosPage() {
  const supabase = await createClient()

  const { data: gastos } = await supabase
    .from('gastos')
    .select('*, categorias_gasto(nombre, icono, color, tipo)')
    .order('fecha', { ascending: false })

  const { data: categorias } = await supabase
    .from('categorias_gasto')
    .select('*')
    .eq('activa', true)
    .order('orden')

  // Fetch open session for new gasto form
  const { data: sesionAbierta } = await supabase
    .from('sesiones_caja')
    .select('id')
    .eq('estado', 'ABIERTA')
    .maybeSingle()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gastos</h1>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">Fijos y Variables</span>
        </div>
        <p className="text-muted-foreground text-sm">Gestion y control de todos los gastos de la academia.</p>
        <div className="header-accent mt-4 w-24" />
      </div>

      <GastosPanel
        gastos={gastos || []}
        categorias={categorias || []}
        sesionId={sesionAbierta?.id || null}
      />
    </div>
  )
}
