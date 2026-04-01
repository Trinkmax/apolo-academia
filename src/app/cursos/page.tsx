import { createClient } from '@/lib/supabase/server'
import { CreateCourseForm } from '@/components/cursos/CreateCourseForm'
import { CursoAlumnosList } from '@/components/cursos/CursoAlumnosList'
import { CourseClassProgress } from '@/components/cursos/CourseClassProgress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, isPast, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, MessageCircle, CalendarDays, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function CursosPage() {
  const supabase = await createClient()

  const { data: cursos, error } = await supabase
    .from('cursos')
    .select(`
      *,
      curso_inscripciones(
        id,
        estado_pago,
        alumnos ( id, nombre_completo, telefono )
      )
    `)
    .order('fecha_inicio', { ascending: true })

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
          <h1 className="text-3xl font-bold tracking-tight">Gestion de Cursos</h1>
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {cursos?.map((curso: any) => {
            const startDate = new Date(curso.fecha_inicio)
            const endDate = new Date(curso.fecha_fin)
            const isCompleted = isPast(endDate)
            const isOngoing = isPast(startDate) && !isCompleted
            const daysToStart = differenceInDays(startDate, new Date())

            const inscripciones = curso.curso_inscripciones || []
            const totalAlumnos = inscripciones.length
            const cupo = curso.cupo_maximo || 10
            const cupoUsado = Math.round((totalAlumnos / cupo) * 100)
            const cupoLleno = totalAlumnos >= cupo

            return (
              <Card key={curso.id} className={`glass card-hover overflow-hidden flex flex-col ${isCompleted ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4 border-b border-border/40" style={{ background: 'hsl(var(--surface-2) / 0.3)' }}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <CardTitle className="text-lg font-bold truncate">{curso.nombre}</CardTitle>
                        {isCompleted ? (
                          <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] shrink-0">Finalizado</Badge>
                        ) : isOngoing ? (
                          <Badge className="badge-verde bg-transparent hover:bg-transparent text-[10px] shrink-0">En curso</Badge>
                        ) : (
                          <Badge className="badge-amarillo bg-transparent hover:bg-transparent text-[10px] shrink-0">
                            Inicia en {daysToStart}d
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-foreground/70 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {format(startDate, "d MMM", { locale: es })} - {format(endDate, "d MMM yyyy", { locale: es })}
                      </CardDescription>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Link
                        href={`/cursos/${curso.id}`}
                        className="h-8 px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all text-xs font-semibold border border-primary/20 flex items-center gap-1.5 hover:shadow-sm hover:shadow-primary/10"
                      >
                        <Users className="w-3.5 h-3.5" /> Asistencia
                      </Link>
                      <a
                        href={curso.whatsapp_link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 bg-verde/10 text-verde hover:bg-verde/20 rounded-lg transition-all flex items-center justify-center border border-verde/20 hover:shadow-sm hover:shadow-verde/10"
                        title="Abrir grupo de WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col flex-1">
                  {/* Course details grid */}
                  <div className="grid grid-cols-2 divide-x divide-border/30">
                    <div className="p-4 flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                        <CalendarDays className="w-3 h-3" /> Dias
                      </span>
                      <span className="text-sm font-medium">{curso.dias_cursado}</span>
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                        <Clock className="w-3 h-3" /> Horario
                      </span>
                      <span className="text-sm font-medium">{curso.horarios}</span>
                    </div>
                  </div>

                  {/* Class progress */}
                  <div className="border-t border-border/30">
                    <CourseClassProgress
                      cursoId={curso.id}
                      claseDates={curso.clase_dates}
                      clasesCompletadas={curso.clases_completadas}
                    />
                  </div>

                  {/* Alumnos section */}
                  <div className="p-5 flex-1 flex flex-col border-t border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        Alumnos inscriptos
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16">
                          <div
                            className={`progress-bar-fill ${cupoLleno ? 'bg-rojo' : cupoUsado > 70 ? 'bg-amarillo' : 'bg-primary'}`}
                            style={{ width: `${Math.min(cupoUsado, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold tabular-nums ${cupoLleno ? 'text-rojo' : 'text-primary'}`}>
                          {totalAlumnos}/{cupo}
                        </span>
                      </div>
                    </div>

                    <CursoAlumnosList
                      inscripciones={inscripciones}
                      cursoId={curso.id}
                      cursoNombre={curso.nombre}
                      claseDates={curso.clase_dates}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
