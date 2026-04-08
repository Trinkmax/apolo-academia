// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Loader2, Banknote } from 'lucide-react'
import { MetodoPagoSelector } from '@/components/shared/MetodoPagoSelector'

export function AddPaymentForm({ inscripcionId, montoPactado, totalAbonado, alumnoId, cursoId, alumnoNombre, cursoNombre }: { inscripcionId: string, montoPactado: number, totalAbonado: number, alumnoId?: string, cursoId?: string, alumnoNombre?: string, cursoNombre?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [monto, setMonto] = useState<string>('')
  const [tipo, setTipo] = useState<string>('CUOTA')
  const [metodo, setMetodo] = useState('efectivo')
  const [cuentaId, setCuentaId] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const deudaRestante = montoPactado - totalAbonado
  const progress = montoPactado > 0 ? Math.min((totalAbonado / montoPactado) * 100, 100) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      toast.error('Ingresa un monto valido')
      return
    }

    setLoading(true)
    try {
      // Get cuenta nombre if transferencia
      let cuentaNombre: string | null = null
      if (metodo === 'transferencia' && cuentaId) {
        const { data: cuentaData } = await supabase
          .from('cuentas_transferencia')
          .select('nombre')
          .eq('id', cuentaId)
          .single()
        cuentaNombre = cuentaData?.nombre || null
      }

      const { data: pago, error: pagoErr } = await supabase
        .from('pagos')
        .insert([{
          inscripcion_id: inscripcionId,
          monto: Number(monto),
          tipo: tipo,
          fecha_pago: new Date().toISOString().split('T')[0],
          metodo_pago: metodo,
          cuenta_destino: cuentaNombre,
        }])
        .select('id')
        .single()

      if (pagoErr) throw pagoErr

      // Registrar movimiento de caja (reporte)
      const { data: sesionAbierta } = await supabase
        .from('sesiones_caja')
        .select('id')
        .eq('estado', 'ABIERTA')
        .maybeSingle()

      const conceptoTipo = tipo === 'SEÑA' ? 'Seña' : tipo === 'TOTAL' ? 'Pago completo' : 'Cuota/Parcial'
      await supabase.from('movimientos_caja').insert([{
        tipo: 'INGRESO',
        concepto: `${conceptoTipo} - ${alumnoNombre || 'Alumno'} - ${cursoNombre || 'Curso'}`,
        monto: Number(monto),
        alumno_id: alumnoId || null,
        curso_id: cursoId || null,
        inscripcion_id: inscripcionId,
        pago_id: pago.id,
        sesion_caja_id: sesionAbierta?.id || null,
        metodo_pago: metodo,
      }])

      const nuevoTotal = totalAbonado + Number(monto)
      const nuevoEstado = nuevoTotal >= montoPactado ? 'AL_DIA' : 'PENDIENTE'

      const { error: updateErr } = await supabase
        .from('curso_inscripciones')
        .update({ estado_pago: nuevoEstado })
        .eq('id', inscripcionId)

      if (updateErr) throw updateErr

      toast.success('Pago registrado', { description: `Nuevo estado: ${nuevoEstado}` })
      setOpen(false)
      setMonto('')
      setMetodo('efectivo')
      setCuentaId('')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al guardar el pago', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50 h-9 text-xs font-semibold transition-all" />}>
        <Banknote className="w-3.5 h-3.5 mr-1.5" />
        Cobrar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg">Registrar Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Debt summary */}
          <div className="px-4 py-3 rounded-xl border border-border/40 bg-card/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground font-medium">Deuda Restante</span>
              <span className="text-base font-bold text-rojo tabular-nums">${deudaRestante.toLocaleString('es-AR')}</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-bar-fill ${progress > 60 ? 'bg-verde' : progress > 30 ? 'bg-amarillo' : 'bg-rojo'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">${totalAbonado.toLocaleString('es-AR')} abonado</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">${montoPactado.toLocaleString('es-AR')} total</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Monto a abonar ($)</Label>
            <Input
              type="number"
              placeholder="Ej: 5000"
              className="bg-input/30 h-10 text-sm tabular-nums"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tipo de Pago</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="bg-input/30 h-10 text-sm">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEÑA">Sena Inicial</SelectItem>
                <SelectItem value="CUOTA">Cuota o Parcial</SelectItem>
                <SelectItem value="TOTAL">Pago Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Metodo de Pago</Label>
            <MetodoPagoSelector
              metodo={metodo}
              onMetodoChange={setMetodo}
              cuentaId={cuentaId}
              onCuentaChange={setCuentaId}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-verde/30 text-verde hover:bg-verde/10 hover:border-verde/50 h-10 text-xs font-semibold"
              onClick={() => {
                setMonto(deudaRestante.toString())
                setTipo('TOTAL')
              }}
            >
              <DollarSign className="w-3.5 h-3.5 mr-1" />
              Saldar Total
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground h-10 text-xs font-semibold shadow-lg shadow-primary/15">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
