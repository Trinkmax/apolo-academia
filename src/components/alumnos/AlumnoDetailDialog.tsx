// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Phone,
  Mail,
  Loader2,
  GraduationCap,
  Scissors,
  DollarSign,
  Calendar,
  MessageCircle,
  Award,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

type AlumnoDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alumnoId: string
}

export function AlumnoDetailDialog({ open, onOpenChange, alumnoId }: AlumnoDetailDialogProps) {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [alumno, setAlumno] = useState<any>(null)
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [talleres, setTalleres] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])

  useEffect(() => {
    if (open && alumnoId) {
      loadData()
    }
  }, [open, alumnoId])

  async function loadData() {
    setLoading(true)
    try {
      const [
        { data: alumnoData },
        { data: insData },
        { data: talleresData },
        { data: alertasData },
      ] = await Promise.all([
        supabase.from('alumnos').select('*').eq('id', alumnoId).single(),
        supabase.from('curso_inscripciones').select('*, cursos(nombre), pagos(monto, fecha_pago, tipo, metodo_pago)').eq('alumno_id', alumnoId),
        supabase.from('talleres_practica').select('*').eq('alumno_id', alumnoId).order('fecha', { ascending: false }),
        supabase.from('alertas').select('*').eq('referencia_id', alumnoId).eq('tipo', 'alumno').order('fecha_vencimiento'),
      ])

      setAlumno(alumnoData)
      setInscripciones(insData || [])
      setTalleres(talleresData || [])
      setAlertas(alertasData || [])
    } finally {
      setLoading(false)
    }
  }

  async function eliminarAlumno() {
    setDeleting(true)
    try {
      // Get all inscripcion IDs for cascade delete
      const insIds = inscripciones.map(i => i.id)

      // Delete in order respecting FK constraints
      if (insIds.length > 0) {
        await supabase.from('asistencias').delete().in('inscripcion_id', insIds)
        await supabase.from('pagos').delete().in('inscripcion_id', insIds)
      }
      await supabase.from('movimientos_caja').delete().eq('alumno_id', alumnoId)
      await supabase.from('mensajes_enviados').delete().eq('alumno_id', alumnoId)
      await supabase.from('alertas').delete().eq('referencia_id', alumnoId).eq('tipo', 'alumno')
      await supabase.from('talleres_practica').delete().eq('alumno_id', alumnoId)
      if (insIds.length > 0) {
        await supabase.from('curso_inscripciones').delete().in('id', insIds)
      }

      const { error } = await supabase.from('alumnos').delete().eq('id', alumnoId)
      if (error) throw error

      toast.success('Alumno eliminado')
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al eliminar alumno', { description: err.message })
    } finally {
      setDeleting(false)
    }
  }

  const handleWhatsApp = () => {
    if (!alumno?.telefono) return
    const numero = alumno.telefono.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${numero}`, '_blank')
  }

  // Derived
  const talleresAsistidos = talleres.filter(t => t.asistio).length
  let certificacion = 'Barbero Inicial'
  let certColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  if (talleresAsistidos >= 10) {
    certificacion = 'Barbero Profesional'
    certColor = 'text-primary bg-primary/10 border-primary/20'
  } else if (talleresAsistidos >= 5) {
    certificacion = 'Barbero Profesional Junior'
    certColor = 'text-verde bg-verde/10 border-verde/20'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] glass border-border/50 p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : alumno ? (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-border/30">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                    {alumno.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base font-bold">{alumno.nombre_completo}</DialogTitle>
                    <DialogDescription className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="w-2.5 h-2.5" /> {alumno.telefono}
                      </span>
                      {alumno.email && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Mail className="w-2.5 h-2.5" /> {alumno.email}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={handleWhatsApp}
                      className="w-7 h-7 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 flex items-center justify-center transition-all border border-[#25D366]/20"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Certificacion */}
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${certColor}`}>
                <Award className="w-4 h-4" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold">{certificacion}</p>
                  <p className="text-[9px] opacity-70">
                    {talleresAsistidos < 5
                      ? `${5 - talleresAsistidos} talleres mas para Profesional Junior`
                      : talleresAsistidos < 10
                      ? `${10 - talleresAsistidos} talleres mas para Profesional`
                      : 'Nivel maximo alcanzado'}
                  </p>
                </div>
                <span className="text-base font-bold tabular-nums">{talleresAsistidos}</span>
                <span className="text-[9px] opacity-60">talleres</span>
              </div>

              {/* Inscripciones/Cursos */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3 text-primary" />
                  Cursos inscriptos ({inscripciones.length})
                </h3>
                {inscripciones.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 px-2">Sin inscripciones</p>
                ) : (
                  <div className="space-y-2">
                    {inscripciones.map((ins: any) => {
                      const totalAbonado = ins.pagos?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0
                      const montoPactado = Number(ins.monto_pactado) || 0
                      const progress = montoPactado > 0 ? Math.min((totalAbonado / montoPactado) * 100, 100) : 0

                      const estadoStyle =
                        ins.estado_pago === 'AL_DIA' ? { color: 'hsl(var(--verde))', bg: 'hsl(var(--verde) / 0.1)' } :
                        ins.estado_pago === 'DEUDOR' ? { color: 'hsl(var(--rojo))', bg: 'hsl(var(--rojo) / 0.1)' } :
                        { color: 'hsl(var(--amarillo))', bg: 'hsl(var(--amarillo) / 0.1)' }

                      return (
                        <div key={ins.id} className="p-3 rounded-xl border" style={{ borderColor: 'hsl(var(--border) / 0.3)', background: 'hsl(var(--card) / 0.5)' }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold">{ins.cursos?.nombre}</span>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ color: estadoStyle.color, background: estadoStyle.bg }}
                            >
                              {ins.estado_pago === 'AL_DIA' ? 'Al dia' : ins.estado_pago === 'SEÑADO' ? 'Senado' : ins.estado_pago === 'DEUDOR' ? 'Deudor' : 'Pendiente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--surface-3))' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  background: progress >= 100 ? 'hsl(var(--verde))' : progress > 0 ? 'hsl(var(--amarillo))' : 'hsl(var(--rojo) / 0.4)',
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold tabular-nums whitespace-nowrap">
                              ${totalAbonado.toLocaleString('es-AR')} / ${montoPactado.toLocaleString('es-AR')}
                            </span>
                          </div>
                          {/* Payment list */}
                          {ins.pagos?.length > 0 && (
                            <div className="mt-2 space-y-0.5">
                              {ins.pagos.map((p: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
                                  <span>{p.tipo === 'SEÑA' ? 'Sena' : p.tipo === 'TOTAL' ? 'Total' : 'Cuota'} - ${Number(p.monto).toLocaleString('es-AR')}</span>
                                  <span className="tabular-nums">{format(new Date(p.fecha_pago + 'T12:00:00'), 'd MMM', { locale: es })}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Talleres */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Scissors className="w-3 h-3 text-primary" />
                  Talleres de practica ({talleres.length})
                </h3>
                {talleres.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 px-2">Sin talleres registrados</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {talleres.map((t, i) => (
                      <div key={t.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px]" style={{ background: 'hsl(var(--card) / 0.5)', borderColor: 'hsl(var(--border) / 0.3)' }}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-muted-foreground">#{i + 1}</span>
                          <span className="tabular-nums text-muted-foreground/60">{format(new Date(t.fecha + 'T12:00:00'), 'd MMM yyyy', { locale: es })}</span>
                          <span className="font-semibold tabular-nums">${Number(t.monto || 5000).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] font-semibold"
                            style={t.asistio
                              ? { color: 'hsl(var(--verde))', background: 'hsl(var(--verde) / 0.1)' }
                              : { color: 'hsl(var(--muted-foreground) / 0.4)', background: 'hsl(var(--muted-foreground) / 0.05)' }
                            }
                          >
                            {t.asistio ? 'Asistio' : 'Ausente'}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] font-semibold"
                            style={t.pagado
                              ? { color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' }
                              : { color: 'hsl(var(--rojo))', background: 'hsl(var(--rojo) / 0.1)' }
                            }
                          >
                            {t.pagado ? 'Pagado' : 'Debe'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alertas */}
              {alertas.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-amarillo" />
                    Recordatorios ({alertas.filter(a => !a.completada).length} pendientes)
                  </h3>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {alertas.map(a => (
                      <div key={a.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px]" style={{ background: 'hsl(var(--card) / 0.5)', borderColor: 'hsl(var(--border) / 0.3)', opacity: a.completada ? 0.5 : 1 }}>
                        <span className={a.completada ? 'line-through text-muted-foreground' : ''}>{a.descripcion}</span>
                        <span className="text-[9px] text-muted-foreground tabular-nums">{format(new Date(a.fecha_vencimiento + 'T12:00:00'), 'd MMM', { locale: es })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info extra */}
              <div className="text-[10px] text-muted-foreground/50 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Registrado: {alumno.creado_en ? format(new Date(alumno.creado_en), "d MMM yyyy", { locale: es }) : 'N/A'}
              </div>

              {/* Eliminar alumno */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-rojo/30 text-rojo hover:bg-rojo/10 hover:border-rojo/50 h-9 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Eliminar alumno
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rojo" />
                      Eliminar alumno
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminara a <strong>{alumno.nombre_completo}</strong> junto con todas sus inscripciones, pagos, talleres, asistencias y recordatorios. Esta accion no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={eliminarAlumno}
                      disabled={deleting}
                      className="bg-rojo text-white hover:bg-rojo/90"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-muted-foreground text-sm">Alumno no encontrado</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
