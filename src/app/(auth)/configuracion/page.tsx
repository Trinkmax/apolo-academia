import { createClient } from '@/lib/supabase/server'
import { CuentasManager } from '@/components/configuracion/CuentasManager'
import { Settings } from 'lucide-react'

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const { data: cuentas } = await supabase
    .from('cuentas_transferencia')
    .select('*')
    .order('orden')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Ajustes generales del sistema.</p>
        <div className="header-accent mt-4 w-24" />
      </div>

      <CuentasManager cuentas={cuentas || []} />
    </div>
  )
}
