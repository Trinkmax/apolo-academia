import { createClient } from '@/lib/supabase/server'
import { History } from 'lucide-react'
import { SesionesPanel } from '@/components/caja/SesionesPanel'

export default async function SesionesPage() {
  const supabase = await createClient()

  const { data: sesiones } = await supabase
    .from('sesiones_caja')
    .select('*')
    .order('fecha_apertura', { ascending: false })

  // Fetch all movements grouped by session for detail views
  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select('*')
    .order('creado_en', { ascending: false })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sesiones de Caja</h1>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">Historial</span>
        </div>
        <p className="text-muted-foreground text-sm">Historial completo de aperturas, cierres y arqueos de caja.</p>
        <div className="header-accent mt-4 w-24" />
      </div>

      <SesionesPanel
        sesiones={sesiones || []}
        movimientos={movimientos || []}
      />
    </div>
  )
}
