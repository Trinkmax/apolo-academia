import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { AttendanceGrid } from '@/components/cursos/AttendanceGrid'
import Link from 'next/link'
import { ChevronLeft, Users, Calendar, Clock } from 'lucide-react'

export default async function CursoDetallePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cursoId = params.id
  const supabase = await createClient()

  const { data: curso } = await supabase.from('cursos').select('*').eq('id', cursoId).single()

  const { data: inscripciones } = await supabase
    .from('curso_inscripciones')
    .select(`
      id,
      alumnos ( id, nombre_completo )
    `)
    .eq('curso_id', cursoId)
    .order('creado_en', { ascending: false })

  const inscripcionesIds = inscripciones?.map(i => i.id) || []
  let asistencias: any[] = []

  if (inscripcionesIds.length > 0) {
    const { data } = await supabase
      .from('asistencias')
      .select('*')
      .in('inscripcion_id', inscripcionesIds)
    asistencias = data || []
  }

  if (!curso) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Link href="/cursos" className="text-primary text-sm mt-2 hover:underline">Volver a cursos</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link href="/cursos" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 transition-colors w-fit">
          <ChevronLeft className="w-3.5 h-3.5" /> Volver a cursos
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{curso.nombre}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-primary" />
            {curso.fecha_inicio} - {curso.fecha_fin}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-primary" />
            {curso.horarios}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3 h-3 text-primary" />
            {inscripciones?.length || 0} alumnos
          </span>
        </div>
        <div className="header-accent mt-4 w-24" />
      </div>

      <Card className="glass border-border/40 shadow-lg shadow-black/10">
        <CardContent className="p-6">
          <AttendanceGrid
            cursoId={curso.id}
            inscripciones={inscripciones || []}
            asistenciasHistoricas={asistencias}
          />
        </CardContent>
      </Card>
    </div>
  )
}
