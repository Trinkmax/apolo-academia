import { createClient } from '@/lib/supabase/server'
import { AlertTemplateManager } from '@/components/alertas/AlertTemplateManager'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'

export default async function PlantillasPage() {
  const supabase = await createClient()

  const { data: plantillas } = await supabase
    .from('alerta_plantillas_defecto')
    .select('*')
    .order('orden', { ascending: true })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/alertas" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3 h-3" />
            Volver a Alertas
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            Plantillas de Alertas
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Configura las alertas que se generan automaticamente al crear un nuevo curso.
          </p>
          <div className="header-accent mt-4 w-24" />
        </div>
      </div>

      <AlertTemplateManager plantillas={plantillas || []} />
    </div>
  )
}
