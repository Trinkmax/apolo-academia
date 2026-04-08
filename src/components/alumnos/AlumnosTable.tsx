// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, CheckCircle2, Clock, AlertCircle, Users, GraduationCap, Bookmark } from 'lucide-react'
import { AlumnoDetailDialog } from './AlumnoDetailDialog'

type AlumnosTableProps = {
  inscripciones: any[]
}

function getStatusBadge(estado: string) {
  switch (estado) {
    case 'AL_DIA': return <Badge className="badge-verde bg-transparent text-[11px] font-semibold">Al Dia</Badge>
    case 'SEÑADO': return <Badge className="badge-amarillo bg-transparent text-[11px] font-semibold">Senado</Badge>
    case 'PENDIENTE': return <Badge className="badge-amarillo bg-transparent text-[11px] font-semibold">Pendiente</Badge>
    case 'DEUDOR': return <Badge className="badge-rojo bg-transparent text-[11px] font-semibold">Deudor</Badge>
    default: return <Badge variant="outline">{estado}</Badge>
  }
}

export function AlumnosTable({ inscripciones }: AlumnosTableProps) {
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleRowClick(alumnoId: string) {
    setSelectedAlumnoId(alumnoId)
    setDialogOpen(true)
  }

  return (
    <>
      <Card className="glass overflow-hidden border-border/40 shadow-xl shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border/50" style={{ background: 'hsl(var(--surface-2) / 0.5)' }}>
                <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alumno</th>
                <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Curso</th>
                <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right hidden lg:table-cell">Contacto</th>
                <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="px-4 sm:px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Abonado / Total</th>
              </tr>
            </thead>
            <tbody>
              {inscripciones?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">Sin alumnos inscriptos aun</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Usa el boton "Inscribir Alumno" para comenzar.</p>
                  </td>
                </tr>
              ) : (
                inscripciones?.map((ins: any) => {
                  const alumno = ins.alumnos
                  const curso = ins.cursos
                  const totalAbonado = ins.pagos?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0
                  const montoPactado = Number(ins.monto_pactado)
                  const progress = montoPactado > 0 ? Math.min((totalAbonado / montoPactado) * 100, 100) : 0

                  const avatarColor =
                    ins.estado_pago === 'AL_DIA' ? 'bg-verde/10 text-verde' :
                    ins.estado_pago === 'SEÑADO' ? 'bg-amarillo/10 text-amarillo' :
                    ins.estado_pago === 'DEUDOR' ? 'bg-rojo/10 text-rojo' :
                    'bg-blue-500/10 text-blue-400'

                  return (
                    <tr
                      key={ins.id}
                      className="table-row-hover border-b border-border/30 last:border-0 cursor-pointer"
                      onClick={() => handleRowClick(ins.alumno_id)}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor}`}>
                            {alumno?.nombre_completo?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-[13px]">
                              {alumno?.nombre_completo}
                            </span>
                            {alumno?.talleres_realizados > 0 && (
                              <p className="text-[10px] text-primary font-medium">
                                {alumno.talleres_realizados} talleres
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground md:hidden flex items-center gap-1 mt-0.5">
                              <GraduationCap className="w-3 h-3 text-primary/60" />
                              {curso?.nombre}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[13px]">
                          <GraduationCap className="w-3.5 h-3.5 text-primary/60" />
                          {curso?.nombre}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right hidden lg:table-cell">
                        <div className="flex items-center justify-end gap-1.5 text-muted-foreground text-[13px]">
                          <Phone className="w-3 h-3" />
                          {alumno?.telefono}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {getStatusBadge(ins.estado_pago)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="text-[13px]">
                            <span className="font-semibold text-foreground">${totalAbonado.toLocaleString('es-AR')}</span>
                            <span className="text-muted-foreground/50 mx-1">/</span>
                            <span className="text-muted-foreground">${montoPactado.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="progress-bar w-20">
                            <div
                              className={`progress-bar-fill ${
                                progress >= 100 ? 'bg-verde' : progress > 0 ? 'bg-amarillo' : 'bg-rojo/50'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedAlumnoId && (
        <AlumnoDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          alumnoId={selectedAlumnoId}
        />
      )}
    </>
  )
}
