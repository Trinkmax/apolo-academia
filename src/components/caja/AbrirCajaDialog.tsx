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
import { Unlock, Loader2, Wallet } from 'lucide-react'

export function AbrirCajaDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [montoInicial, setMontoInicial] = useState('')
  const [notas, setNotas] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!montoInicial || Number(montoInicial) < 0) {
      toast.error('Ingresa un monto inicial valido')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('sesiones_caja').insert([{
        monto_inicial: Number(montoInicial),
        notas_apertura: notas || null,
      }])

      if (error) {
        if (error.message.includes('idx_sesion_caja_abierta')) {
          toast.error('Ya hay una caja abierta')
        } else {
          throw error
        }
        return
      }

      toast.success('Caja abierta', { description: `Monto inicial: $${Number(montoInicial).toLocaleString('es-AR')}` })
      setOpen(false)
      setMontoInicial('')
      setNotas('')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al abrir caja', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-verde text-white hover:bg-verde/90 font-semibold h-9 text-xs shadow-lg shadow-verde/15" />}>
        <Unlock className="w-3.5 h-3.5 mr-1.5" />
        Abrir Caja
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg">Abrir Caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Info box */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-primary/15 bg-primary/5">
            <Wallet className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-foreground/80">Solo efectivo</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                El monto inicial es el efectivo fisico en caja para dar cambios. Los pagos por transferencia o tarjeta no afectan este monto.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Efectivo en caja ($)</Label>
            <Input
              type="number"
              placeholder="Ej: 5000"
              className="bg-input/30 h-10 text-sm tabular-nums"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Conta el efectivo disponible antes de abrir.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notas (opcional)</Label>
            <Textarea
              placeholder="Observaciones de apertura..."
              className="bg-input/30 text-sm resize-none"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-verde text-white hover:bg-verde/90 h-10 text-sm font-semibold shadow-lg shadow-verde/15">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Unlock className="w-4 h-4 mr-1.5" />}
            Confirmar Apertura
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
