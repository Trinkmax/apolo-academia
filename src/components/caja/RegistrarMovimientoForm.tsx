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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowUpCircle, Loader2 } from 'lucide-react'
import type { CategoriaGasto } from '@/lib/supabase/types'

interface RegistrarMovimientoFormProps {
  tipo: 'INGRESO'
  sesionId: string | null
  categorias: CategoriaGasto[]
}

export function RegistrarMovimientoForm({ tipo, sesionId, categorias }: RegistrarMovimientoFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [notas, setNotas] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!concepto.trim()) {
      toast.error('Ingresa un concepto')
      return
    }
    if (!monto || Number(monto) <= 0) {
      toast.error('Ingresa un monto valido')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('movimientos_caja').insert([{
        tipo: 'INGRESO',
        concepto: concepto.trim(),
        monto: Number(monto),
        metodo_pago: metodoPago,
        sesion_caja_id: sesionId,
        notas: notas || null,
      }])

      if (error) throw error

      toast.success('Ingreso registrado', { description: `$${Number(monto).toLocaleString('es-AR')} - ${concepto}` })
      setOpen(false)
      setConcepto('')
      setMonto('')
      setMetodoPago('efectivo')
      setNotas('')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al registrar', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 glass hover:border-verde/30 hover:bg-verde/5 transition-all group text-left" />
      }>
        <div className="w-8 h-8 rounded-lg bg-verde/10 flex items-center justify-center shrink-0">
          <ArrowUpCircle className="w-4 h-4 text-verde" />
        </div>
        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Registrar ingreso</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg">Registrar Ingreso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Concepto</Label>
            <Input
              placeholder="Ej: Venta de producto, Ingreso extra..."
              className="bg-input/30 h-10 text-sm"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Monto ($)</Label>
              <Input
                type="number"
                placeholder="0"
                className="bg-input/30 h-10 text-sm tabular-nums"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Metodo de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="bg-input/30 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="debito">Debito</SelectItem>
                  <SelectItem value="credito">Credito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notas (opcional)</Label>
            <Textarea
              placeholder="Detalle adicional..."
              className="bg-input/30 text-sm resize-none"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
          {!sesionId && (
            <p className="text-[11px] text-amarillo bg-amarillo/5 border border-amarillo/20 rounded-lg px-3 py-2">
              No hay caja abierta. El movimiento se registrara sin sesion.
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full bg-verde text-white hover:bg-verde/90 h-10 text-sm font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ArrowUpCircle className="w-4 h-4 mr-1.5" />}
            Registrar Ingreso
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
