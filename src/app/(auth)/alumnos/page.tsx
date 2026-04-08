import { createClient } from '@/lib/supabase/server'
import { CreateSaleForm } from '@/components/alumnos/CreateSaleForm'
import { AlumnosTable } from '@/components/alumnos/AlumnosTable'
import { CheckCircle2, Clock, AlertCircle, Bookmark } from 'lucide-react'

export default async function AlumnosPage() {
  const supabase = await createClient()

  const { data: cursos } = await supabase.from('cursos').select('*').order('creado_en', { ascending: false })

  const { data: inscripciones, error } = await supabase
    .from('curso_inscripciones')
    .select(`
      *,
      alumnos (
        nombre_completo,
        telefono,
        talleres_realizados
      ),
      cursos (
        nombre
      ),
      pagos (
        monto
      )
    `)
    .order('creado_en', { ascending: false })

  if (error) {
    console.error(error)
  }

  const alDia = inscripciones?.filter(i => i.estado_pago === 'AL_DIA').length || 0
  const senados = inscripciones?.filter(i => i.estado_pago === 'SEÑADO').length || 0
  const deudores = inscripciones?.filter(i => i.estado_pago === 'DEUDOR').length || 0
  const pendientes = inscripciones?.filter(i => i.estado_pago === 'PENDIENTE').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alumnos e Inscripciones</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Alta de alumnos, inscripciones y estado de pagos.</p>
          <div className="header-accent mt-4 w-24" />
        </div>
        <CreateSaleForm cursos={cursos || []} />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-verde/5 border border-verde/15">
          <CheckCircle2 className="w-4 h-4 text-verde" />
          <div>
            <p className="text-lg font-bold text-verde tabular-nums">{alDia}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Al dia</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amarillo/5 border border-amarillo/15">
          <Bookmark className="w-4 h-4 text-amarillo" />
          <div>
            <p className="text-lg font-bold text-amarillo tabular-nums">{senados}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Senados</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rojo/5 border border-rojo/15">
          <AlertCircle className="w-4 h-4 text-rojo" />
          <div>
            <p className="text-lg font-bold text-rojo tabular-nums">{deudores}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Deudores</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <Clock className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-lg font-bold text-blue-400 tabular-nums">{pendientes}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pendientes</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <AlumnosTable inscripciones={inscripciones || []} />
    </div>
  )
}
