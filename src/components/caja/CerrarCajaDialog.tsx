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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Lock, Loader2, AlertTriangle, CheckCircle2, Wallet } from 'lucide-react'

interface CerrarCajaDialogProps {
  sesionId: string
  montoInicial: number
  ingresosEfectivo: number
  egresosEfectivo: number
}

export function CerrarCajaDialog({ sesionId, montoInicial, ingresosEfectivo, egresosEfectivo }: CerrarCajaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [montoReal, setMontoReal] = useState('')
  const [notas, setNotas] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const esperado = montoInicial + ingresosEfectivo - egresosEfectivo
  const diferencia = montoReal ? Number(montoReal) - esperado : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!montoReal || Number(montoReal) < 0) {
      toast.error('Ingresa el monto contado en caja')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('sesiones_caja')
        .update({
          estado: 'CERRADA',
          fecha_cierre: new Date().toISOString(),
          monto_cierre_esperado: esperado,
          monto_cierre_real: Number(montoReal),
          diferencia: Number(montoReal) - esperado,
          notas_cierre: notas || null,
        })
        .eq('id', sesionId)

      if (error) throw error

      const diff = Number(montoReal) - esperado
      toast.success('Caja cerrada', {
        description: diff === 0
          ? 'Arqueo perfecto - sin diferencia'
          : `Diferencia: ${diff > 0 ? '+' : ''}$${diff.toLocaleString('es-AR')}`,
      })
      setOpen(false)
      setMontoReal('')
      setNotas('')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al cerrar caja', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="border-rojo/30 text-rojo hover:bg-rojo/10 hover:border-rojo/50 h-9 text-xs font-semibold" />}>
        <Lock className="w-3.5 h-3.5 mr-1.5" />
        Cerrar Caja
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg">Arqueo y Cierre de Caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Summary */}
          <div className="space-y-2 px-4 py-3 rounded-xl border border-border/40 bg-card/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Arqueo de efectivo</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Efectivo inicial</span>
              <span className="font-bold tabular-nums">${montoInicial.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-verde">+ Cobros en efectivo</span>
              <span className="font-bold text-verde tabular-nums">+${ingresosEfectivo.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-rojo">- Egresos en efectivo</span>
              <span className="font-bold text-rojo tabular-nums">-${egresosEfectivo.toLocaleString('es-AR')}</span>
            </div>
            <div className="border-t border-border/40 pt-2 flex justify-between text-sm">
              <span className="font-semibold">Efectivo esperado</span>
              <span className="font-bold text-primary tabular-nums">${esperado.toLocaleString('es-AR')}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 pt-0.5">
              Transferencias y tarjetas no se incluyen en el arqueo.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Monto real contado ($)</Label>
            <Input
              type="number"
              placeholder="Conta el efectivo en caja..."
              className="bg-input/30 h-10 text-sm tabular-nums"
              value={montoReal}
              onChange={(e) => setMontoReal(e.target.value)}
            />
          </div>

          {/* Difference indicator */}
          {diferencia !== null && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
              diferencia === 0 ? 'border-verde/20 bg-verde/5' :
              Math.abs(diferencia) <= 100 ? 'border-amarillo/20 bg-amarillo/5' :
              'border-rojo/20 bg-rojo/5'
            }`}>
              {diferencia === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-verde shrink-0" />
              ) : (
                <AlertTriangle className={`w-4 h-4 shrink-0 ${Math.abs(diferencia) <= 100 ? 'text-amarillo' : 'text-rojo'}`} />
              )}
              <div>
                <p className={`text-xs font-bold ${
                  diferencia === 0 ? 'text-verde' :
                  Math.abs(diferencia) <= 100 ? 'text-amarillo' : 'text-rojo'
                }`}>
                  {diferencia === 0 ? 'Arqueo perfecto' :
                   diferencia > 0 ? `Sobrante: +$${diferencia.toLocaleString('es-AR')}` :
                   `Faltante: -$${Math.abs(diferencia).toLocaleString('es-AR')}`}
                </p>
                {diferencia !== 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {Math.abs(diferencia) <= 100 ? 'Diferencia menor' : 'Verificar movimientos no registrados'}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notas de cierre (opcional)</Label>
            <Textarea
              placeholder="Observaciones del cierre..."
              className="bg-input/30 text-sm resize-none"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-rojo text-white hover:bg-rojo/90 h-10 text-sm font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Lock className="w-4 h-4 mr-1.5" />}
            Confirmar Cierre
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
