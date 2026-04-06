// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AlertFormFields } from '@/components/alertas/AlertFormFields'
import { Bell, Check, Clock, AlertTriangle, Plus, ExternalLink, Loader2 } from 'lucide-react'
import { isPast, isToday, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Alerta } from '@/lib/supabase/types'
import Link from 'next/link'

interface CursoAlertsBellProps {
  cursoId: string
  cursoNombre: string
  pendingCount: number
}

export function CursoAlertsBell({ cursoId, cursoNombre, pendingCount }: CursoAlertsBellProps) {
  const [open, setOpen] = useState(false)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    fetchAlertas()
  }, [open])

  async function fetchAlertas() {
    setLoading(true)
    const { data } = await supabase
      .from('alertas')
      .select('*')
      .eq('tipo', 'curso')
      .eq('referencia_id', cursoId)
      .order('completada', { ascending: true })
      .order('fecha_vencimiento', { ascending: true })
    setAlertas(data || [])
    setLoading(false)
  }

  async function toggleComplete(id: string, currentValue: boolean | null) {
    setCompleting(id)
    const newVal = !currentValue
    const { error } = await supabase
      .from('alertas')
      .update({ completada: newVal })
      .eq('id', id)

    if (error) {
      toast.error('Error al actualizar')
    } else {
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, completada: newVal } : a))
      router.refresh()
    }
    setCompleting(null)
  }

  const pending = alertas.filter(a => !a.completada)
  const completed = alertas.filter(a => a.completada)

  function getStatusIcon(a: Alerta) {
    if (a.completada) return <Check className="w-3 h-3 text-verde" />
    const d = new Date(a.fecha_vencimiento)
    if (isPast(d) && !isToday(d)) return <AlertTriangle className="w-3 h-3 text-rojo" />
    if (isToday(d)) return <Clock className="w-3 h-3 text-amarillo" />
    return <Clock className="w-3 h-3 text-muted-foreground" />
  }

  function getStatusClass(a: Alerta) {
    if (a.completada) return 'opacity-50'
    const d = new Date(a.fecha_vencimiento)
    if (isPast(d) && !isToday(d)) return 'border-l-2 border-l-rojo'
    if (isToday(d)) return 'border-l-2 border-l-amarillo'
    return ''
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative w-8 h-8 bg-amarillo/10 text-amarillo hover:bg-amarillo/20 rounded-lg transition-all flex items-center justify-center border border-amarillo/20 hover:shadow-sm hover:shadow-amarillo/10"
          title={`${pendingCount} alertas pendientes`}
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rojo text-[9px] font-bold text-white flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[440px] glass border-border/50 flex flex-col">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="text-base">Alertas - {cursoNombre}</SheetTitle>
          <SheetDescription className="text-xs">
            {pending.length} pendiente{pending.length !== 1 ? 's' : ''} | {completed.length} resuelta{completed.length !== 1 ? 's' : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : alertas.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No hay alertas para este curso</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {pending.map(a => (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/30 ${getStatusClass(a)}`}>
                  <button
                    onClick={() => toggleComplete(a.id, a.completada)}
                    disabled={completing === a.id}
                    className="mt-0.5 w-5 h-5 rounded-md border-2 border-muted-foreground/30 hover:border-verde hover:bg-verde/10 transition-colors flex items-center justify-center shrink-0"
                  >
                    {completing === a.id && <Loader2 className="w-3 h-3 animate-spin" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">{a.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {getStatusIcon(a)}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(a.fecha_vencimiento + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        a.color_etiqueta === 'naranja' ? 'bg-naranja/10 text-naranja' :
                        a.color_etiqueta === 'rojo' ? 'bg-rojo/10 text-rojo' : 'bg-azul/10 text-azul'
                      }`}>
                        {a.color_etiqueta === 'naranja' ? 'Accion' : a.color_etiqueta === 'rojo' ? 'Urgente' : 'Info'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {completed.length > 0 && (
                <>
                  <div className="pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Resueltas</p>
                  </div>
                  {completed.map(a => (
                    <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/20 ${getStatusClass(a)}`}>
                      <button
                        onClick={() => toggleComplete(a.id, a.completada)}
                        disabled={completing === a.id}
                        className="mt-0.5 w-5 h-5 rounded-md border-2 border-verde/40 bg-verde/10 flex items-center justify-center shrink-0"
                      >
                        {completing === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-verde" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight line-through text-muted-foreground">{a.descripcion}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {format(new Date(a.fecha_vencimiento + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-border/30 space-y-2">
          {showForm ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Nueva alerta para este curso</p>
                <button onClick={() => setShowForm(false)} className="text-[10px] text-muted-foreground hover:text-foreground">
                  Cancelar
                </button>
              </div>
              <AlertFormFields
                alumnos={[]}
                cursos={[]}
                defaultTipo="curso"
                defaultReferenciaId={cursoId}
                onSuccess={() => { setShowForm(false); fetchAlertas() }}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Nueva Alerta
              </Button>
              <Link
                href={`/alertas`}
                className="flex-1 h-9 text-xs border border-border/40 rounded-md flex items-center justify-center gap-1.5 hover:bg-muted/30 transition-colors font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Centro de Alertas
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
