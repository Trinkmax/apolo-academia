import { createClient } from '@/lib/supabase/server'
import { CreateCourseForm } from '@/components/cursos/CreateCourseForm'
import { Card } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { CursosTabsView } from '@/components/cursos/CursosTabsView'

export default async function CursosPage() {
  const supabase = await createClient()

  const [{ data: cursos, error }, { data: alertasPendientes }] = await Promise.all([
    supabase
      .from('cursos')
      .select(`
        *,
        curso_inscripciones(
          id,
          estado_pago,
          alumnos ( id, nombre_completo, telefono )
        )
      `)
      .order('fecha_inicio', { ascending: true }),
    supabase
      .from('alertas')
      .select('referencia_id')
      .eq('tipo', 'curso')
      .eq('completada', false),
  ])

  // Build alert count map
  const alertCountMap: Record<string, number> = {}
  alertasPendientes?.forEach((a: any) => {
    alertCountMap[a.referencia_id] = (alertCountMap[a.referencia_id] || 0) + 1
  })

  if (error) {
    console.error('Error fetching courses:', error)
    return (
      <div className="p-6 rounded-xl bg-rojo/5 border border-rojo/20">
        <h3 className="font-bold text-rojo">Error cargando cursos</h3>
        <code className="text-xs bg-black/50 p-2 mt-2 rounded block whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</code>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestion de Cursos</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Administra cohortes, inscriptos y enlaces de WhatsApp.</p>
          <div className="header-accent mt-4 w-24" />
        </div>
        <CreateCourseForm />
      </div>

      {cursos?.length === 0 ? (
        <Card className="glass flex flex-col items-center justify-center p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold">No hay cursos activos</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-8">
            Comienza configurando tu primer cohorte indicando la fecha de inicio.
          </p>
          <CreateCourseForm />
        </Card>
      ) : (
        <CursosTabsView cursos={cursos} alertCountMap={alertCountMap} />
      )}
    </div>
  )
}
