// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { differenceInDays, isPast, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, MessageCircle, CalendarDays, Users, BookOpen, CheckCircle2, Archive, ChevronDown } from 'lucide-react'
import { CursoAlertsBell } from '@/components/cursos/CursoAlertsBell'
import { DeleteCursoButton } from '@/components/cursos/DeleteCursoButton'
import { CursoAlumnosList } from '@/components/cursos/CursoAlumnosList'
import { CourseClassProgress } from '@/components/cursos/CourseClassProgress'

type CursosTabsViewProps = {
  cursos: any[]
  alertCountMap: Record<string, number>
}

function CursoCard({ curso, alertCountMap }: { curso: any; alertCountMap: Record<string, number> }) {
  const startDate = new Date(curso.fecha_inicio)
  const endDate = new Date(curso.fecha_fin)
  const isCompleted = isPast(endDate)
  const isOngoing = isPast(startDate) && !isCompleted
  const daysToStart = differenceInDays(startDate, new Date())

  const inscripciones = curso.curso_inscripciones || []
  const totalAlumnos = inscripciones.length

  return (
    <Card className="glass card-hover overflow-hidden flex flex-col">
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
            <DeleteCursoButton cursoId={curso.id} cursoNombre={curso.nombre} />
            <CursoAlertsBell
              cursoId={curso.id}
              cursoNombre={curso.nombre}
              pendingCount={alertCountMap[curso.id] || 0}
            />
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

        <div className="border-t border-border/30">
          <CourseClassProgress
            cursoId={curso.id}
            claseDates={curso.clase_dates}
            clasesCompletadas={curso.clases_completadas}
          />
        </div>

        <div className="p-3 sm:p-5 flex-1 flex flex-col border-t border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Users className="w-3.5 h-3.5 text-primary" />
              Alumnos inscriptos
            </h4>
            <span className="text-[10px] font-bold tabular-nums text-primary">
              {totalAlumnos} inscriptos
            </span>
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
}

export function CursosTabsView({ cursos, alertCountMap }: CursosTabsViewProps) {
  const [showFinalizados, setShowFinalizados] = useState(false)

  const cursosActivos = cursos.filter((c) => !isPast(new Date(c.fecha_fin)))
  const cursosFinalizados = cursos.filter((c) => isPast(new Date(c.fecha_fin)))

  return (
    <div className="space-y-8">
      {/* Cursos activos - siempre visibles */}
      {cursosActivos.length === 0 ? (
        <Card className="glass flex flex-col items-center justify-center p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold">No hay cursos activos</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Todos los cursos han finalizado o aun no se ha creado ninguno.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {cursosActivos.map((curso) => (
            <CursoCard key={curso.id} curso={curso} alertCountMap={alertCountMap} />
          ))}
        </div>
      )}

      {/* Separador + boton finalizados */}
      <div className="space-y-6">
        <div className="relative flex items-center">
          <div className="flex-1 border-t border-border/40" />
          <Button
            variant="outline"
            onClick={() => cursosFinalizados.length > 0 && setShowFinalizados(!showFinalizados)}
            className={`mx-4 gap-2 px-4 h-9 text-xs font-semibold border-border/60 ${cursosFinalizados.length === 0 ? 'text-muted-foreground/40 cursor-default' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Archive className="w-3.5 h-3.5" />
            Cursos finalizados
            <Badge variant="outline" className={`ml-0.5 text-[10px] px-1.5 py-0 ${cursosFinalizados.length === 0 ? 'border-muted-foreground/20 text-muted-foreground/40' : 'border-muted-foreground/30 text-muted-foreground'}`}>
              {cursosFinalizados.length}
            </Badge>
            {cursosFinalizados.length > 0 && (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFinalizados ? 'rotate-180' : ''}`} />
            )}
          </Button>
          <div className="flex-1 border-t border-border/40" />
        </div>

        {/* Seccion expandible con animacion */}
        {cursosFinalizados.length > 0 && (
          <div
            className={`grid transition-all duration-300 ease-in-out ${showFinalizados ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {cursosFinalizados.map((curso) => (
                  <CursoCard key={curso.id} curso={curso} alertCountMap={alertCountMap} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
