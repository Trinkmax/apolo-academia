// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Phone,
  CheckCircle2,
  Loader2,
  DollarSign,
  Calendar,
  GraduationCap,
  Scissors,
  Banknote,
  Plus,
  MessageCircle,
  Award,
  Minus,
  Check,
  X,
  Bell,
  CreditCard,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { registrarMovimientoCaja } from '@/lib/caja-utils'
import { MetodoPagoSelector } from '@/components/shared/MetodoPagoSelector'

type AlumnoProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alumnoId: string
  alumnoNombre: string
  alumnoTelefono: string
  inscripcionId: string
  cursoId: string
  cursoNombre: string
  estadoPago: string
  claseDates: string[] | null
}

const METODO_ICONS: Record<string, any> = {
  efectivo: Wallet,
  transferencia: ArrowRightLeft,
  tarjeta: CreditCard,
}

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
}

export function AlumnoProfileDialog({
  open,
  onOpenChange,
  alumnoId,
  alumnoNombre,
  alumnoTelefono,
  inscripcionId,
  cursoId,
  cursoNombre,
  estadoPago: initialEstadoPago,
  claseDates,
}: AlumnoProfileDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [asistencias, setAsistencias] = useState<any[]>([])
  const [pagos, setPagos] = useState<any[]>([])
  const [talleres, setTalleres] = useState<any[]>([])
  const [alumno, setAlumno] = useState<any>(null)
  const [estadoPago, setEstadoPago] = useState(initialEstadoPago)
  const [montoPactado, setMontoPactado] = useState(70000)

  // Payment form
  const [showPayForm, setShowPayForm] = useState(false)
  const [payMonto, setPayMonto] = useState('')
  const [payMetodo, setPayMetodo] = useState('efectivo')
  const [payCuentaId, setPayCuentaId] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  // Taller form
  const [tallerLoading, setTallerLoading] = useState(false)
  const [showTallerForm, setShowTallerForm] = useState(false)
  const [tallerCount, setTallerCount] = useState(1)
  const [tallerPagado, setTallerPagado] = useState(true)
  const [tallerMetodo, setTallerMetodo] = useState('efectivo')
  const [tallerCuentaId, setTallerCuentaId] = useState('')
  const [tallerMonto, setTallerMonto] = useState('5000')
  // For inline payment method selection when toggling a taller to paid
  const [payingTallerId, setPayingTallerId] = useState<string | null>(null)
  const [payingTallerMetodo, setPayingTallerMetodo] = useState('efectivo')
  const [payingTallerCuentaId, setPayingTallerCuentaId] = useState('')

  // Asistencia toggle loading
  const [asisLoading, setAsisLoading] = useState<string | null>(null)

  // Reminder form
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderDesc, setReminderDesc] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderLoading, setReminderLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  async function loadData() {
    setLoading(true)
    try {
      const [
        { data: alumnoData },
        { data: asisData },
        { data: pagosData },
        { data: talleresData },
        { data: insData },
      ] = await Promise.all([
        supabase.from('alumnos').select('*').eq('id', alumnoId).single(),
        supabase.from('asistencias').select('*').eq('inscripcion_id', inscripcionId).order('fecha_clase'),
        supabase.from('pagos').select('*').eq('inscripcion_id', inscripcionId).order('fecha_pago', { ascending: false }),
        supabase.from('talleres_practica').select('*').eq('alumno_id', alumnoId).order('fecha'),
        supabase.from('curso_inscripciones').select('estado_pago, monto_pactado').eq('id', inscripcionId).single(),
      ])

      setAlumno(alumnoData)
      setAsistencias(asisData || [])
      setPagos(pagosData || [])
      setTalleres(talleresData || [])
      if (insData) {
        setEstadoPago(insData.estado_pago)
        setMontoPactado(insData.monto_pactado || 70000)
      }
    } finally {
      setLoading(false)
    }
  }

  // --- ASISTENCIA ---
  // Toggle: gris (sin registro) → verde (presente) → rojo (ausente) → gris (elimina registro)
  async function toggleAsistencia(fecha: string) {
    setAsisLoading(fecha)
    try {
      const existing = asistencias.find(a => a.fecha_clase === fecha)
      if (existing) {
        if (existing.presente) {
          // presente → ausente
          await supabase.from('asistencias').update({ presente: false }).eq('id', existing.id)
          setAsistencias(prev => prev.map(a => a.id === existing.id ? { ...a, presente: false } : a))
        } else {
          // ausente → gris (eliminar registro)
          await supabase.from('asistencias').delete().eq('id', existing.id)
          setAsistencias(prev => prev.filter(a => a.id !== existing.id))
        }
      } else {
        // gris → presente
        const { data, error } = await supabase.from('asistencias')
          .insert({ inscripcion_id: inscripcionId, fecha_clase: fecha, presente: true })
          .select()
          .single()
        if (error) throw error
        if (data) setAsistencias(prev => [...prev, data])
      }
      router.refresh()
    } catch (err: any) {
      toast.error('Error al marcar asistencia', { description: err.message })
    } finally {
      setAsisLoading(null)
    }
  }

  // --- PAGOS ---
  async function recalcularEstadoPago(nuevoTotalAbonado: number) {
    const nuevoEstado = nuevoTotalAbonado >= montoPactado ? 'AL_DIA' : nuevoTotalAbonado > 0 ? 'PENDIENTE' : 'SEÑADO'
    await supabase.from('curso_inscripciones').update({ estado_pago: nuevoEstado }).eq('id', inscripcionId)
    setEstadoPago(nuevoEstado)
  }

  async function handlePago() {
    const monto = Number(payMonto)
    if (!monto || monto <= 0) {
      toast.error('Monto invalido')
      return
    }
    setPayLoading(true)
    try {
      // Resolve cuenta name
      let cuentaNombre: string | null = null
      if (payMetodo === 'transferencia' && payCuentaId) {
        const { data: cuentaData } = await supabase.from('cuentas_transferencia').select('nombre').eq('id', payCuentaId).single()
        cuentaNombre = cuentaData?.nombre || null
      }

      const insertData: any = {
        inscripcion_id: inscripcionId,
        monto,
        tipo: 'CUOTA',
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: payMetodo,
        cuenta_destino: cuentaNombre,
      }

      const { data: pago, error } = await supabase.from('pagos').insert(insertData).select().single()
      if (error) throw error

      if (pago) {
        setPagos(prev => [pago, ...prev])

        // Registrar movimiento en caja
        await registrarMovimientoCaja(supabase, {
          tipo: 'INGRESO',
          concepto: `Cuota/Parcial - ${alumnoNombre} - ${cursoNombre}`,
          monto,
          alumno_id: alumnoId,
          curso_id: cursoId,
          inscripcion_id: inscripcionId,
          pago_id: pago.id,
          metodo_pago: payMetodo,
        })
      }

      const nuevoTotal = pagos.reduce((s, p) => s + Number(p.monto), 0) + monto
      await recalcularEstadoPago(nuevoTotal)

      toast.success(`Pago de $${monto.toLocaleString('es-AR')} registrado`)
      setPayMonto('')
      setPayMetodo('efectivo')
      setPayCuentaId('')
      setShowPayForm(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al registrar pago', { description: err.message })
    } finally {
      setPayLoading(false)
    }
  }

  async function pagarTotal() {
    const totalAbonado = pagos.reduce((s, p) => s + Number(p.monto), 0)
    const resta = montoPactado - totalAbonado
    if (resta <= 0) {
      toast.info('Ya esta al dia')
      return
    }
    setPayMonto(resta.toString())
    setShowPayForm(true)
  }

  // --- TALLERES ---
  async function agregarTalleres() {
    if (tallerCount < 1) return
    setTallerLoading(true)
    try {
      const montoTaller = Number(tallerMonto) || 5000

      // Resolve cuenta name
      let cuentaNombre: string | null = null
      if (tallerPagado && tallerMetodo === 'transferencia' && tallerCuentaId) {
        const { data: cuentaData } = await supabase.from('cuentas_transferencia').select('nombre').eq('id', tallerCuentaId).single()
        cuentaNombre = cuentaData?.nombre || null
      }

      const rows = Array.from({ length: tallerCount }, () => ({
        alumno_id: alumnoId,
        pagado: tallerPagado,
        asistio: false,
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: tallerPagado ? tallerMetodo : 'efectivo',
        cuenta_destino: cuentaNombre,
        monto: montoTaller,
      }))

      const { data, error } = await supabase.from('talleres_practica').insert(rows).select()
      if (error) throw error

      if (data) {
        setTalleres(prev => [...prev, ...data])
        toast.success(`${tallerCount} taller${tallerCount > 1 ? 'es' : ''} agregado${tallerCount > 1 ? 's' : ''}`)

        // Registrar movimientos en caja si pagado
        if (tallerPagado) {
          for (const t of data) {
            await registrarMovimientoCaja(supabase, {
              tipo: 'INGRESO',
              concepto: `Taller practica - ${alumnoNombre}`,
              monto: montoTaller,
              alumno_id: alumnoId,
              metodo_pago: tallerMetodo,
            })
          }
        }
      }
      setTallerCount(1)
      setTallerPagado(true)
      setTallerMetodo('efectivo')
      setTallerCuentaId('')
      setTallerMonto('5000')
      setShowTallerForm(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al agregar talleres', { description: err.message })
    } finally {
      setTallerLoading(false)
    }
  }

  async function toggleTallerAsistio(tallerId: string, currentAsistio: boolean) {
    const newAsistio = !currentAsistio

    const { error } = await supabase.from('talleres_practica').update({ asistio: newAsistio }).eq('id', tallerId)
    if (error) {
      toast.error('Error al actualizar asistencia', { description: error.message })
      return
    }

    setTalleres(prev => prev.map(t => t.id === tallerId ? { ...t, asistio: newAsistio } : t))

    // Update talleres_realizados on alumno
    const newCount = talleres.filter(t => t.id === tallerId ? newAsistio : t.asistio).length
    await supabase.from('alumnos').update({ talleres_realizados: newCount }).eq('id', alumnoId)

    router.refresh()
  }

  async function toggleTallerPagado(tallerId: string, currentPagado: boolean) {
    if (currentPagado) {
      // Toggling to unpaid - just flip
      const { error } = await supabase.from('talleres_practica').update({ pagado: false }).eq('id', tallerId)
      if (error) {
        toast.error('Error al actualizar pago', { description: error.message })
        return
      }
      setTalleres(prev => prev.map(t => t.id === tallerId ? { ...t, pagado: false } : t))
      setPayingTallerId(null)
      router.refresh()
    } else {
      // Toggling to paid - show payment method selector
      setPayingTallerId(tallerId)
      setPayingTallerMetodo('efectivo')
      setPayingTallerCuentaId('')
    }
  }

  async function confirmarPagoTaller() {
    if (!payingTallerId) return

    // Resolve cuenta name
    let cuentaNombre: string | null = null
    if (payingTallerMetodo === 'transferencia' && payingTallerCuentaId) {
      const { data: cuentaData } = await supabase.from('cuentas_transferencia').select('nombre').eq('id', payingTallerCuentaId).single()
      cuentaNombre = cuentaData?.nombre || null
    }

    const updateData: any = {
      pagado: true,
      metodo_pago: payingTallerMetodo,
      cuenta_destino: cuentaNombre,
    }
    const { error } = await supabase.from('talleres_practica').update(updateData).eq('id', payingTallerId)
    if (error) {
      toast.error('Error al actualizar pago', { description: error.message })
      return
    }
    const taller = talleres.find(t => t.id === payingTallerId)
    setTalleres(prev => prev.map(t => t.id === payingTallerId ? { ...t, ...updateData } : t))

    // Registrar movimiento en caja
    if (taller) {
      await registrarMovimientoCaja(supabase, {
        tipo: 'INGRESO',
        concepto: `Taller practica - ${alumnoNombre}`,
        monto: taller.monto || 5000,
        alumno_id: alumnoId,
        metodo_pago: payingTallerMetodo,
      })
    }

    setPayingTallerId(null)
    router.refresh()
  }

  // --- RECORDATORIO ---
  async function crearRecordatorio() {
    if (!reminderDesc.trim() || !reminderDate) {
      toast.error('Completa la descripcion y la fecha')
      return
    }
    setReminderLoading(true)
    try {
      const { error } = await supabase.from('alertas').insert({
        descripcion: `${alumnoNombre}: ${reminderDesc}`,
        fecha_vencimiento: reminderDate,
        tipo: 'alumno',
        referencia_id: alumnoId,
        color_etiqueta: 'naranja',
        completada: false,
      })
      if (error) throw error

      toast.success('Recordatorio creado')
      setReminderDesc('')
      setReminderDate('')
      setShowReminderForm(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al crear recordatorio', { description: err.message })
    } finally {
      setReminderLoading(false)
    }
  }

  // Derived data
  const totalAbonado = pagos.reduce((s, p) => s + Number(p.monto), 0)
  const pagoProgress = Math.min((totalAbonado / montoPactado) * 100, 100)
  const talleresAsistidos = talleres.filter(t => t.asistio).length
  const talleresPagados = talleres.filter(t => t.pagado).length

  // Certification level
  let certificacion = 'Barbero Inicial'
  let certColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  if (talleresAsistidos >= 10) {
    certificacion = 'Barbero Profesional'
    certColor = 'text-primary bg-primary/10 border-primary/20'
  } else if (talleresAsistidos >= 5) {
    certificacion = 'Barbero Profesional Junior'
    certColor = 'text-verde bg-verde/10 border-verde/20'
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    'AL_DIA': { label: 'Al dia', color: 'text-verde', bg: 'bg-verde/10 border-verde/20' },
    'SEÑADO': { label: 'Senado', color: 'text-amarillo', bg: 'bg-amarillo/10 border-amarillo/20' },
    'PENDIENTE': { label: 'Pendiente', color: 'text-amarillo', bg: 'bg-amarillo/10 border-amarillo/20' },
    'DEUDOR': { label: 'Deudor', color: 'text-rojo', bg: 'bg-rojo/10 border-rojo/20' },
  }
  const status = statusConfig[estadoPago] || statusConfig['PENDIENTE']

  const handleWhatsApp = () => {
    const numero = alumnoTelefono.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${numero}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] glass border-border/50 p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border/30">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
                {alumnoNombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-bold">{alumnoNombre}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Phone className="w-2.5 h-2.5" /> {alumnoTelefono}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <GraduationCap className="w-2.5 h-2.5" /> {cursoNombre}
                  </span>
                </DialogDescription>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all border"
                  style={showReminderForm ? {
                    background: 'hsl(var(--amarillo) / 0.15)',
                    color: 'hsl(var(--amarillo))',
                    borderColor: 'hsl(var(--amarillo) / 0.3)',
                  } : {
                    background: 'hsl(var(--amarillo) / 0.08)',
                    color: 'hsl(var(--amarillo) / 0.7)',
                    borderColor: 'hsl(var(--amarillo) / 0.15)',
                  }}
                  title="Crear recordatorio"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="w-7 h-7 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 flex items-center justify-center transition-all border border-[#25D366]/20"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
                <div
                  className="px-2 py-0.5 rounded-lg text-[9px] font-bold border flex items-center gap-1"
                  style={
                    estadoPago === 'AL_DIA' ? { background: 'hsl(var(--verde) / 0.1)', color: 'hsl(var(--verde))', borderColor: 'hsl(var(--verde) / 0.2)' } :
                    estadoPago === 'DEUDOR' ? { background: 'hsl(var(--rojo) / 0.1)', color: 'hsl(var(--rojo))', borderColor: 'hsl(var(--rojo) / 0.2)' } :
                    { background: 'hsl(var(--amarillo) / 0.1)', color: 'hsl(var(--amarillo))', borderColor: 'hsl(var(--amarillo) / 0.2)' }
                  }
                >
                  {estadoPago === 'AL_DIA' && <CheckCircle2 className="w-2.5 h-2.5" />}
                  {status.label}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* === RECORDATORIO FORM === */}
            {showReminderForm && (
              <div className="p-3 rounded-xl border space-y-2" style={{ borderColor: 'hsl(var(--amarillo) / 0.2)', background: 'hsl(var(--amarillo) / 0.05)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Bell className="w-3 h-3" style={{ color: 'hsl(var(--amarillo))' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--amarillo))' }}>Nuevo recordatorio</span>
                </div>
                <Input
                  value={reminderDesc}
                  onChange={e => setReminderDesc(e.target.value)}
                  placeholder='Ej: "Paga el martes", "Traer modelo"'
                  className="bg-background/50 h-8 text-xs"
                />
                <div className="flex gap-1.5">
                  <Input
                    type="date"
                    value={reminderDate}
                    onChange={e => setReminderDate(e.target.value)}
                    className="bg-background/50 h-8 text-xs flex-1"
                  />
                  <Button
                    onClick={crearRecordatorio}
                    disabled={reminderLoading}
                    className="h-8 text-[10px] font-semibold px-3"
                    style={{ background: 'hsl(var(--amarillo))', color: 'black' }}
                  >
                    {reminderLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Crear'}
                  </Button>
                </div>
              </div>
            )}

            {/* === CERTIFICACION === */}
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

            {/* === ASISTENCIAS AL CURSO === */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-primary" />
                Asistencia al curso ({asistencias.filter(a => a.presente).length}/{claseDates?.length || 5})
              </h3>
              <div className="rounded-xl border p-3 space-y-2.5" style={{ borderColor: 'hsl(var(--primary) / 0.2)', background: 'hsl(var(--primary) / 0.05)' }}>
                <div className="grid grid-cols-5 gap-1.5">
                  {(claseDates || []).map((fecha, i) => {
                    const asis = asistencias.find(a => a.fecha_clase === fecha)
                    const presente = asis?.presente ?? null
                    const isLoading = asisLoading === fecha

                    return (
                      <button
                        key={fecha}
                        onClick={() => toggleAsistencia(fecha)}
                        disabled={isLoading}
                        className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border-2 transition-all hover:scale-[1.03]"
                        style={
                          presente === true ? {
                            background: 'hsl(var(--primary) / 0.2)',
                            borderColor: 'hsl(var(--primary) / 0.6)',
                            boxShadow: '0 2px 8px hsl(var(--primary) / 0.2)',
                          } : presente === false ? {
                            background: 'hsl(var(--rojo) / 0.1)',
                            borderColor: 'hsl(var(--rojo) / 0.3)',
                          } : {
                            background: 'hsl(var(--card) / 0.8)',
                            borderColor: 'hsl(var(--border) / 0.3)',
                          }
                        }
                      >
                        <span className="text-[8px] font-bold uppercase tracking-wider" style={{
                          color: presente === true ? 'hsl(var(--primary))' :
                                 presente === false ? 'hsl(var(--rojo))' :
                                 'hsl(var(--muted-foreground))'
                        }}>
                          Clase {i + 1}
                        </span>
                        <span className="text-[10px] font-semibold tabular-nums" style={{
                          color: presente === true ? 'hsl(var(--primary))' :
                                 presente === false ? 'hsl(var(--rojo))' :
                                 'hsl(var(--foreground) / 0.7)'
                        }}>
                          {format(new Date(fecha + 'T12:00:00'), 'dd/MM', { locale: es })}
                        </span>
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                        ) : presente === true ? (
                          <Check className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                        ) : presente === false ? (
                          <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--rojo))' }} />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* === PAGOS DEL CURSO === */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3 text-primary" />
                  Pagos del curso
                </h3>
                <div className="flex gap-1">
                  {estadoPago !== 'AL_DIA' && (
                    <button
                      onClick={pagarTotal}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md transition-colors"
                      style={{ color: 'hsl(var(--verde))' }}
                    >
                      Saldar total
                    </button>
                  )}
                  <button
                    onClick={() => setShowPayForm(!showPayForm)}
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md transition-colors"
                    style={showPayForm ? { color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' } : { color: 'hsl(var(--muted-foreground))' }}
                  >
                    <Plus className="w-2.5 h-2.5 inline mr-0.5" /> Pago
                  </button>
                </div>
              </div>

              {/* Payment progress bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--surface-3))' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pagoProgress}%`,
                      background: totalAbonado >= montoPactado
                        ? 'hsl(var(--verde))'
                        : totalAbonado > 0
                        ? 'hsl(var(--amarillo))'
                        : 'hsl(var(--rojo) / 0.4)',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums whitespace-nowrap">
                  ${totalAbonado.toLocaleString('es-AR')}
                  <span className="text-muted-foreground font-normal"> / ${montoPactado.toLocaleString('es-AR')}</span>
                </span>
              </div>

              {/* Quick pay form */}
              {showPayForm && (
                <div className="space-y-2 mb-2 p-3 rounded-xl border" style={{ borderColor: 'hsl(var(--border) / 0.3)', background: 'hsl(var(--card) / 0.4)' }}>
                  {/* Monto */}
                  <div className="flex gap-1.5">
                    <div className="flex-1 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={payMonto}
                        onChange={e => setPayMonto(e.target.value)}
                        placeholder="Monto"
                        className="bg-input/30 h-8 text-xs pl-6 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Metodo de pago */}
                  <MetodoPagoSelector
                    metodo={payMetodo}
                    onMetodoChange={setPayMetodo}
                    cuentaId={payCuentaId}
                    onCuentaChange={setPayCuentaId}
                    size="sm"
                  />

                  <Button
                    onClick={handlePago}
                    disabled={payLoading}
                    className="h-8 w-full bg-primary text-primary-foreground text-[10px] font-semibold"
                  >
                    {payLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar pago'}
                  </Button>
                </div>
              )}

              {/* Payment history */}
              {pagos.length > 0 && (
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {pagos.map(p => {
                    const MetodoIcon = METODO_ICONS[p.metodo_pago] || Wallet
                    return (
                      <div key={p.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px]" style={{ background: 'hsl(var(--card) / 0.5)', borderColor: 'hsl(var(--border) / 0.3)' }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: 'hsl(var(--verde) / 0.1)' }}>
                            <DollarSign className="w-2.5 h-2.5" style={{ color: 'hsl(var(--verde))' }} />
                          </div>
                          <span className="font-semibold tabular-nums">${Number(p.monto).toLocaleString('es-AR')}</span>
                          <span className="flex items-center gap-0.5 text-muted-foreground/60">
                            <MetodoIcon className="w-2.5 h-2.5" />
                            <span className="text-[8px]">{METODO_LABELS[p.metodo_pago] || 'Efectivo'}</span>
                            {p.cuenta_destino && <span className="text-[8px]">({p.cuenta_destino})</span>}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {format(new Date(p.fecha_pago + 'T12:00:00'), "d MMM", { locale: es })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* === TALLERES DE PRACTICA === */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Scissors className="w-3 h-3 text-primary" />
                  Talleres de practica
                  {talleres.length > 0 && (
                    <span className="text-[9px] font-normal ml-1">
                      Asistidos: <span style={{ color: 'hsl(var(--verde))' }}>{talleresAsistidos}/{talleres.length}</span>
                      {' | '}
                      Pagados: <span style={{ color: 'hsl(var(--primary))' }}>{talleresPagados}/{talleres.length}</span>
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowTallerForm(!showTallerForm)}
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md transition-colors"
                  style={showTallerForm ? { color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' } : { color: 'hsl(var(--muted-foreground))' }}
                >
                  <Plus className="w-2.5 h-2.5 inline mr-0.5" /> Agregar
                </button>
              </div>

              {/* Add talleres form */}
              {showTallerForm && (
                <div className="space-y-2 mb-3 p-3 rounded-xl border" style={{ borderColor: 'hsl(var(--border) / 0.3)', background: 'hsl(var(--card) / 0.4)' }}>
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">Cantidad</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTallerCount(c => Math.max(1, c - 1))}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:opacity-80"
                        style={{ borderColor: 'hsl(var(--border) / 0.4)', background: 'hsl(var(--card) / 0.6)' }}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold tabular-nums w-6 text-center">{tallerCount}</span>
                      <button
                        onClick={() => setTallerCount(c => Math.min(10, c + 1))}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:opacity-80"
                        style={{ borderColor: 'hsl(var(--border) / 0.4)', background: 'hsl(var(--card) / 0.6)' }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Paid/Unpaid toggle */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTallerPagado(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all"
                      style={tallerPagado ? {
                        background: 'hsl(var(--verde) / 0.1)',
                        borderColor: 'hsl(var(--verde) / 0.3)',
                        color: 'hsl(var(--verde))',
                      } : {
                        background: 'transparent',
                        borderColor: 'hsl(var(--border) / 0.3)',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      <Check className="w-3 h-3" />
                      Pagado
                    </button>
                    <button
                      onClick={() => setTallerPagado(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all"
                      style={!tallerPagado ? {
                        background: 'hsl(var(--amarillo) / 0.1)',
                        borderColor: 'hsl(var(--amarillo) / 0.3)',
                        color: 'hsl(var(--amarillo))',
                      } : {
                        background: 'transparent',
                        borderColor: 'hsl(var(--border) / 0.3)',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      <X className="w-3 h-3" />
                      Debe
                    </button>
                  </div>

                  {/* Monto */}
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground">Monto ($)</span>
                    <Input
                      type="number"
                      value={tallerMonto}
                      onChange={e => setTallerMonto(e.target.value)}
                      placeholder="5000"
                      className="bg-input/30 h-8 text-xs tabular-nums mt-1"
                    />
                  </div>

                  {/* Payment method - only when pagado */}
                  {tallerPagado && (
                    <MetodoPagoSelector
                      metodo={tallerMetodo}
                      onMetodoChange={setTallerMetodo}
                      cuentaId={tallerCuentaId}
                      onCuentaChange={setTallerCuentaId}
                      size="sm"
                    />
                  )}

                  <Button
                    onClick={agregarTalleres}
                    disabled={tallerLoading}
                    className="h-8 w-full bg-primary text-primary-foreground text-[10px] font-semibold"
                  >
                    {tallerLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : `Agregar ${tallerCount} taller${tallerCount > 1 ? 'es' : ''}`}
                  </Button>
                </div>
              )}

              {/* Taller list - unified rows */}
              {talleres.length > 0 && (
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {talleres.map((t, i) => {
                    const MetodoIcon = METODO_ICONS[t.metodo_pago] || Wallet
                    const isPayingThis = payingTallerId === t.id
                    return (
                      <div key={t.id}>
                        <div
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border text-[10px] transition-all"
                          style={{ background: 'hsl(var(--card) / 0.5)', borderColor: 'hsl(var(--border) / 0.3)' }}
                        >
                          {/* Taller number & date */}
                          <div className="flex items-center gap-1.5 min-w-[60px]">
                            <span className="text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                            <span className="text-[9px] text-muted-foreground/60 tabular-nums">
                              {format(new Date(t.fecha + 'T12:00:00'), 'd MMM', { locale: es })}
                            </span>
                          </div>

                          {/* Monto */}
                          <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>
                            ${Number(t.monto || 5000).toLocaleString('es-AR')}
                          </span>

                          <div className="flex-1" />

                          {/* Asistencia toggle */}
                          <button
                            onClick={() => toggleTallerAsistio(t.id, t.asistio)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border transition-all hover:scale-105"
                            style={t.asistio ? {
                              background: 'hsl(var(--verde) / 0.15)',
                              borderColor: 'hsl(var(--verde) / 0.4)',
                              color: 'hsl(var(--verde))',
                            } : {
                              background: 'transparent',
                              borderColor: 'hsl(var(--border) / 0.3)',
                              color: 'hsl(var(--muted-foreground) / 0.4)',
                            }}
                            title={t.asistio ? 'Asistio' : 'Marcar asistencia'}
                          >
                            <Scissors className="w-3 h-3" />
                            <span className="text-[9px] font-medium">{t.asistio ? 'Asistio' : 'Ausente'}</span>
                          </button>

                          {/* Pagado toggle */}
                          <button
                            onClick={() => toggleTallerPagado(t.id, t.pagado)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border transition-all hover:scale-105"
                            style={t.pagado ? {
                              background: 'hsl(var(--primary) / 0.15)',
                              borderColor: 'hsl(var(--primary) / 0.4)',
                              color: 'hsl(var(--primary))',
                            } : {
                              background: 'transparent',
                              borderColor: 'hsl(var(--border) / 0.3)',
                              color: 'hsl(var(--muted-foreground) / 0.4)',
                            }}
                            title={t.pagado ? `Pagado - ${METODO_LABELS[t.metodo_pago] || 'Efectivo'}` : 'Marcar como pagado'}
                          >
                            <Banknote className="w-3 h-3" />
                            <span className="text-[9px] font-medium">{t.pagado ? 'Pagado' : 'Debe'}</span>
                          </button>

                          {/* Payment method badge - only when paid */}
                          {t.pagado && (
                            <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/60" title={t.cuenta_destino ? `${METODO_LABELS[t.metodo_pago]} (${t.cuenta_destino})` : METODO_LABELS[t.metodo_pago]}>
                              <MetodoIcon className="w-2.5 h-2.5" />
                              {t.cuenta_destino && <span>({t.cuenta_destino})</span>}
                            </span>
                          )}
                        </div>

                        {/* Inline payment method selector when marking as paid */}
                        {isPayingThis && (
                          <div className="ml-4 mt-1 mb-1 p-2 rounded-lg border space-y-1.5" style={{ borderColor: 'hsl(var(--primary) / 0.2)', background: 'hsl(var(--primary) / 0.03)' }}>
                            <span className="text-[9px] font-semibold text-muted-foreground">Metodo de pago:</span>
                            <MetodoPagoSelector
                              metodo={payingTallerMetodo}
                              onMetodoChange={setPayingTallerMetodo}
                              cuentaId={payingTallerCuentaId}
                              onCuentaChange={setPayingTallerCuentaId}
                              size="sm"
                            />
                            <div className="flex gap-1">
                              <Button
                                onClick={confirmarPagoTaller}
                                className="h-6 flex-1 text-[9px] font-semibold bg-primary text-primary-foreground"
                              >
                                Confirmar
                              </Button>
                              <Button
                                onClick={() => setPayingTallerId(null)}
                                variant="ghost"
                                className="h-6 text-[9px] px-2"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
