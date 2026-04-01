// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  MessageCircle,
  Send,
  User,
  BookOpen,
  CalendarClock,
  Phone,
  CheckCircle2,
  Loader2,
  Users,
  ExternalLink,
  Copy,
  Pencil,
  FileText,
  History,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Alumno, Curso, MensajePlantilla } from '@/lib/supabase/types'

type EnrichedAlumno = {
  id: string
  nombre_completo: string
  telefono: string
  estado_pago?: string
  monto_pactado?: number
  total_abonado?: number
}

type AlertActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alerta: any
  refName: string
  alumno: EnrichedAlumno | null
  curso: Curso | null
  alumnosCurso: EnrichedAlumno[]
  plantillas: MensajePlantilla[]
}

function detectCategoria(descripcion: string, color: string): string {
  const lower = descripcion.toLowerCase()
  if (color === 'naranja' || lower.includes('cobr') || lower.includes('pago') || lower.includes('deuda') || lower.includes('plata') || lower.includes('mil')) {
    return 'cobro'
  }
  if (lower.includes('record') || lower.includes('aviso') || lower.includes('clase')) {
    return 'recordatorio'
  }
  if (lower.includes('bienvenid') || lower.includes('inscri')) {
    return 'bienvenida'
  }
  if (lower.includes('asistencia') || lower.includes('falt')) {
    return 'asistencia'
  }
  return 'general'
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value)
  }
  return result
}

export function AlertActionDialog({
  open,
  onOpenChange,
  alerta,
  refName,
  alumno,
  curso,
  alumnosCurso,
  plantillas,
}: AlertActionDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const categoria = detectCategoria(alerta.descripcion, alerta.color_etiqueta)

  // Filter templates by detected category + general
  const relevantPlantillas = useMemo(() => {
    return plantillas.filter(p =>
      p.activa && (p.categoria === categoria || p.categoria === 'general')
    )
  }, [plantillas, categoria])

  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [completing, setCompleting] = useState(false)
  const [editingMsg, setEditingMsg] = useState(false)
  const [selectedAlumnos, setSelectedAlumnos] = useState<Set<string>>(new Set())
  const [sendMode, setSendMode] = useState<'individual' | 'grupo' | 'seleccion'>(
    alerta.tipo === 'alumno' ? 'individual' : 'grupo'
  )
  const [showPlantillas, setShowPlantillas] = useState(false)
  const [historial, setHistorial] = useState<any[]>([])
  const [showHistorial, setShowHistorial] = useState(false)
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  // Build template variables
  const templateVars = useMemo(() => {
    const vars: Record<string, string> = {
      descripcion: alerta.descripcion,
      fecha: format(new Date(alerta.fecha_vencimiento), "d 'de' MMMM", { locale: es }),
    }
    if (alumno) {
      vars.nombre = alumno.nombre_completo.split(' ')[0]
      vars.monto = alumno.total_abonado != null && alumno.monto_pactado != null
        ? String(alumno.monto_pactado - alumno.total_abonado)
        : '0'
    }
    if (curso) {
      vars.curso = curso.nombre
    }
    // For curso alerts, use generic name
    if (alerta.tipo === 'curso') {
      vars.nombre = 'equipo'
    }
    return vars
  }, [alerta, alumno, curso])

  // Set initial message from first matching template
  useEffect(() => {
    if (relevantPlantillas.length > 0 && !selectedPlantillaId) {
      const first = relevantPlantillas[0]
      setSelectedPlantillaId(first.id)
      setMensaje(fillTemplate(first.contenido, templateVars))
    } else if (relevantPlantillas.length === 0) {
      // Fallback if no templates match
      setMensaje(`Hola ${templateVars.nombre || ''}, te contactamos desde Academia Apolo.\n\n${alerta.descripcion}\n\nSaludos!`)
    }
  }, []) // Only on mount

  const selectPlantilla = (plantilla: MensajePlantilla) => {
    setSelectedPlantillaId(plantilla.id)
    setMensaje(fillTemplate(plantilla.contenido, templateVars))
    setShowPlantillas(false)
    setEditingMsg(false)
  }

  // Load message history for this alert's target
  const loadHistorial = async () => {
    setLoadingHistorial(true)
    setShowHistorial(true)
    try {
      let query = supabase
        .from('mensajes_enviados')
        .select('*')
        .order('enviado_en', { ascending: false })
        .limit(10)

      if (alerta.tipo === 'alumno') {
        query = query.eq('alumno_id', alerta.referencia_id)
      } else {
        query = query.eq('curso_id', alerta.referencia_id)
      }

      const { data } = await query
      setHistorial(data || [])
    } finally {
      setLoadingHistorial(false)
    }
  }

  // Log sent message to DB
  const logMensaje = async (tipoEnvio: string, canal: string, alumnoId?: string) => {
    await supabase.from('mensajes_enviados').insert({
      alerta_id: alerta.id,
      alumno_id: alumnoId || (alerta.tipo === 'alumno' ? alerta.referencia_id : null),
      curso_id: alerta.tipo === 'curso' ? alerta.referencia_id : null,
      plantilla_id: selectedPlantillaId,
      contenido_enviado: mensaje,
      canal,
      tipo_envio: tipoEnvio,
    })
  }

  const handleSendIndividual = async (phone: string, nombre: string, alumnoId?: string) => {
    const numero = phone.replace(/[^0-9]/g, '')
    const personalizedMsg = fillTemplate(mensaje.replace(/\{nombre\}/g, nombre.split(' ')[0]), {
      ...templateVars,
      nombre: nombre.split(' ')[0],
    })
    // If the message was already filled, just do a simple name replace
    const finalMsg = mensaje.includes(nombre.split(' ')[0])
      ? mensaje
      : mensaje.replace(/Hola [^,!]*[,!]/, `Hola ${nombre.split(' ')[0]},`)
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(finalMsg || personalizedMsg)}`
    window.open(url, '_blank')
    await logMensaje('individual', 'whatsapp', alumnoId)
    toast.success(`WhatsApp abierto para ${nombre}`)
  }

  const handleSendGroup = async () => {
    if (!curso?.whatsapp_link) {
      toast.error('Este curso no tiene enlace de grupo de WhatsApp')
      return
    }
    navigator.clipboard.writeText(mensaje)
    await logMensaje('grupo', 'whatsapp_grupo')
    toast.success('Mensaje copiado. Se abre el grupo...')
    window.open(curso.whatsapp_link, '_blank')
  }

  const handleSendSelected = async () => {
    if (selectedAlumnos.size === 0) {
      toast.error('Selecciona al menos un alumno')
      return
    }
    const targets = alumnosCurso.filter(a => selectedAlumnos.has(a.id))
    for (const a of targets) {
      await handleSendIndividual(a.telefono, a.nombre_completo, a.id)
    }
    await logMensaje('masivo', 'whatsapp')
    toast.success(`Mensajes enviados a ${targets.length} alumnos`)
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await supabase.from('alertas').update({ completada: true }).eq('id', alerta.id)
      toast.success('Tarea marcada como resuelta')
      onOpenChange(false)
      router.refresh()
    } finally {
      setCompleting(false)
    }
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(mensaje)
    toast.success('Mensaje copiado al portapapeles')
  }

  const toggleAlumno = (id: string) => {
    setSelectedAlumnos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedAlumnos.size === alumnosCurso.length) {
      setSelectedAlumnos(new Set())
    } else {
      setSelectedAlumnos(new Set(alumnosCurso.map(a => a.id)))
    }
  }

  const colorMap: Record<string, string> = {
    rojo: 'text-rojo bg-rojo/10 border-rojo/20',
    naranja: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    azul: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  }
  const priorityLabel: Record<string, string> = {
    rojo: 'Urgente',
    naranja: 'Cobros / Acciones',
    azul: 'Informativo',
  }

  const categoriaLabels: Record<string, string> = {
    cobro: 'Cobro',
    recordatorio: 'Recordatorio',
    bienvenida: 'Bienvenida',
    general: 'General',
    asistencia: 'Asistencia',
    graduacion: 'Graduacion',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] glass border-border/50 p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/30">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-bold leading-snug">
                  {alerta.descripcion}
                </DialogTitle>
                <DialogDescription className="mt-2 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                    {alerta.tipo === 'alumno' ? <User className="w-3 h-3 text-primary" /> : <BookOpen className="w-3 h-3 text-primary" />}
                    {refName}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="w-3 h-3" />
                    {format(new Date(alerta.fecha_vencimiento), "d 'de' MMMM yyyy", { locale: es })}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colorMap[alerta.color_etiqueta] || colorMap.azul}`}>
                    {priorityLabel[alerta.color_etiqueta] || 'Info'}
                  </span>
                </DialogDescription>
              </div>
              {/* Historial button */}
              <button
                type="button"
                onClick={showHistorial ? () => setShowHistorial(false) : loadHistorial}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  showHistorial
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60'
                }`}
              >
                <History className="w-3 h-3" />
                {showHistorial ? 'Volver' : 'Historial'}
              </button>
            </div>
          </DialogHeader>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* === HISTORIAL VIEW === */}
          {showHistorial ? (
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Historial de mensajes enviados
              </h3>
              {loadingHistorial ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : historial.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay mensajes enviados aun</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historial.map(msg => (
                    <div key={msg.id} className="rounded-xl border border-border/30 bg-card/50 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={msg.canal === 'whatsapp_grupo' ? 'badge-azul bg-transparent text-[9px]' : 'badge-verde bg-transparent text-[9px]'}>
                            {msg.canal === 'whatsapp_grupo' ? 'Grupo' : 'Individual'}
                          </Badge>
                          <Badge className="bg-muted/30 text-muted-foreground border-border/30 text-[9px]">
                            {msg.tipo_envio}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {msg.enviado_en ? formatDistanceToNow(new Date(msg.enviado_en), { addSuffix: true, locale: es }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {msg.contenido_enviado}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* === CRM CONTEXT - Student info card === */}
              {alerta.tipo === 'alumno' && alumno && (
                <div className="rounded-xl border border-border/30 bg-card/50 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {alumno.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{alumno.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {alumno.telefono}
                      </p>
                    </div>
                    {alumno.estado_pago && (
                      <Badge className={
                        alumno.estado_pago === 'AL_DIA' ? 'badge-verde bg-transparent text-[10px]' :
                        alumno.estado_pago === 'DEUDOR' ? 'badge-rojo bg-transparent text-[10px]' :
                        'badge-amarillo bg-transparent text-[10px]'
                      }>
                        {alumno.estado_pago === 'AL_DIA' ? 'Al dia' : alumno.estado_pago === 'DEUDOR' ? 'Deudor' : 'Pendiente'}
                      </Badge>
                    )}
                  </div>
                  {/* Payment context */}
                  {alumno.monto_pactado != null && alumno.monto_pactado > 0 && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border/20">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Abonado</span>
                          <span className="font-semibold tabular-nums">
                            ${alumno.total_abonado?.toLocaleString() || 0} / ${alumno.monto_pactado?.toLocaleString()}
                          </span>
                        </div>
                        <div className="progress-bar h-1.5">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(100, ((alumno.total_abonado || 0) / alumno.monto_pactado) * 100)}%` }}
                          />
                        </div>
                      </div>
                      {(alumno.monto_pactado - (alumno.total_abonado || 0)) > 0 && (
                        <span className="text-[10px] font-bold text-rojo tabular-nums">
                          -${(alumno.monto_pactado - (alumno.total_abonado || 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* === SEND MODE SELECTOR (curso) === */}
              {alerta.tipo === 'curso' && alumnosCurso.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Modo de envio
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSendMode('grupo')}
                      className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        sendMode === 'grupo'
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border/40 text-muted-foreground hover:border-border/60'
                      }`}
                    >
                      <Users className="w-4 h-4 mx-auto mb-1" />
                      Grupo WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMode('seleccion')}
                      className={`flex-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        sendMode === 'seleccion'
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border/40 text-muted-foreground hover:border-border/60'
                      }`}
                    >
                      <User className="w-4 h-4 mx-auto mb-1" />
                      Alumnos individuales
                    </button>
                  </div>
                </div>
              )}

              {/* === STUDENT SELECTOR (seleccion mode) === */}
              {sendMode === 'seleccion' && alumnosCurso.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Seleccionar destinatarios
                    </label>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      {selectedAlumnos.size === alumnosCurso.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-border/30 p-2">
                    {alumnosCurso.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAlumno(a.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                          selectedAlumnos.has(a.id)
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/30 border border-transparent'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          selectedAlumnos.has(a.id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}>
                          {selectedAlumnos.has(a.id) && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{a.nombre_completo}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {a.telefono}
                          </p>
                        </div>
                        {a.estado_pago && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            a.estado_pago === 'AL_DIA' ? 'text-verde bg-verde/10' :
                            a.estado_pago === 'DEUDOR' ? 'text-rojo bg-rojo/10' :
                            'text-amarillo bg-amarillo/10'
                          }`}>
                            {a.estado_pago === 'AL_DIA' ? 'Al dia' : a.estado_pago === 'DEUDOR' ? 'Deudor' : 'Pend.'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* === TEMPLATE SELECTOR === */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Plantilla de mensaje
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPlantillas(!showPlantillas)}
                    className={`text-[10px] font-medium flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                      showPlantillas ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    {showPlantillas ? 'Cerrar' : 'Cambiar plantilla'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${showPlantillas ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {showPlantillas && (
                  <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto rounded-lg border border-border/30 p-2">
                    {plantillas.filter(p => p.activa).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPlantilla(p)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                          selectedPlantillaId === p.id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/30 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold">{p.nombre}</p>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
                            {categoriaLabels[p.categoria] || p.categoria}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {p.contenido.substring(0, 100)}...
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* === MESSAGE COMPOSER === */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Mensaje a enviar
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMsg(!editingMsg)}
                      className={`text-[10px] font-medium flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                        editingMsg ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Pencil className="w-3 h-3" /> {editingMsg ? 'Editando' : 'Editar'}
                    </button>
                  </div>
                </div>
                {editingMsg ? (
                  <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    rows={6}
                    className="w-full bg-input/30 border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none transition-all"
                    placeholder="Escribe tu mensaje..."
                  />
                ) : (
                  <div className="bg-card/50 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                    {mensaje}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {!showHistorial && (
          <div className="px-6 py-4 border-t border-border/30 bg-card/30 space-y-3">
            {/* Send buttons */}
            <div className="flex gap-2">
              {alerta.tipo === 'alumno' && alumno && (
                <Button
                  onClick={() => handleSendIndividual(alumno.telefono, alumno.nombre_completo, alumno.id)}
                  className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white h-10 text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Enviar a {alumno.nombre_completo.split(' ')[0]}
                </Button>
              )}

              {sendMode === 'grupo' && alerta.tipo === 'curso' && (
                <Button
                  onClick={handleSendGroup}
                  className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white h-10 text-xs font-semibold"
                >
                  <Users className="w-4 h-4 mr-1.5" />
                  Enviar al Grupo
                  <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />
                </Button>
              )}

              {sendMode === 'seleccion' && alerta.tipo === 'curso' && (
                <Button
                  onClick={handleSendSelected}
                  disabled={selectedAlumnos.size === 0}
                  className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white h-10 text-xs font-semibold disabled:opacity-40"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Enviar a {selectedAlumnos.size} alumno{selectedAlumnos.size !== 1 ? 's' : ''}
                </Button>
              )}
            </div>

            {/* Complete task */}
            {!alerta.completada && (
              <Button
                onClick={handleComplete}
                disabled={completing}
                variant="outline"
                className="w-full h-9 border-verde/30 text-verde hover:bg-verde/10 hover:border-verde/50 text-xs font-semibold"
              >
                {completing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                Marcar como resuelta
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
