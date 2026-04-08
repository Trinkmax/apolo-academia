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
import { ArrowDownCircle, Loader2 } from 'lucide-react'
import type { CategoriaGasto } from '@/lib/supabase/types'

interface RegistrarGastoFormProps {
  sesionId: string | null
  categorias: CategoriaGasto[]
}

export function RegistrarGastoForm({ sesionId, categorias }: RegistrarGastoFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [tipoGasto, setTipoGasto] = useState('VARIABLE')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [comprobanteNumero, setComprobanteNumero] = useState('')
  const [notas, setNotas] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const categoriasFiltradas = categorias.filter(c => c.tipo === tipoGasto)

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
    if (!categoriaId) {
      toast.error('Selecciona una categoria')
      return
    }

    setLoading(true)
    try {
      // Create gasto
      const { data: gasto, error: gastoErr } = await supabase
        .from('gastos')
        .insert([{
          categoria_id: categoriaId,
          concepto: concepto.trim(),
          monto: Number(monto),
          tipo: tipoGasto,
          metodo_pago: metodoPago,
          comprobante_numero: comprobanteNumero || null,
          notas: notas || null,
          sesion_caja_id: sesionId,
        }])
        .select('id')
        .single()

      if (gastoErr) throw gastoErr

      // Create corresponding EGRESO movement
      const { error: movErr } = await supabase.from('movimientos_caja').insert([{
        tipo: 'EGRESO',
        concepto: concepto.trim(),
        monto: Number(monto),
        metodo_pago: metodoPago,
        sesion_caja_id: sesionId,
        categoria_id: categoriaId,
        gasto_id: gasto.id,
      }])

      if (movErr) throw movErr

      toast.success('Gasto registrado', { description: `$${Number(monto).toLocaleString('es-AR')} - ${concepto}` })
      setOpen(false)
      setConcepto('')
      setMonto('')
      setCategoriaId('')
      setMetodoPago('efectivo')
      setComprobanteNumero('')
      setNotas('')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al registrar gasto', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 glass hover:border-rojo/30 hover:bg-rojo/5 transition-all group text-left" />
      }>
        <div className="w-8 h-8 rounded-lg bg-rojo/10 flex items-center justify-center shrink-0">
          <ArrowDownCircle className="w-4 h-4 text-rojo" />
        </div>
        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Registrar gasto</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg">Registrar Gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setTipoGasto('VARIABLE'); setCategoriaId('') }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tipoGasto === 'VARIABLE'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-card/50 text-muted-foreground border border-border/40 hover:border-border/60'
              }`}
            >
              Variable
            </button>
            <button
              type="button"
              onClick={() => { setTipoGasto('FIJO'); setCategoriaId('') }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tipoGasto === 'FIJO'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-card/50 text-muted-foreground border border-border/40 hover:border-border/60'
              }`}
            >
              Fijo
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Categoria</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger className="bg-input/30 h-10 text-sm">
                <SelectValue placeholder="Seleccionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasFiltradas.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Concepto</Label>
            <Input
              placeholder="Ej: Compra de insumos, Pago alquiler..."
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
            <Label className="text-xs font-medium">N. Comprobante (opcional)</Label>
            <Input
              placeholder="Ej: FAC-0001234"
              className="bg-input/30 h-10 text-sm"
              value={comprobanteNumero}
              onChange={(e) => setComprobanteNumero(e.target.value)}
            />
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
              No hay caja abierta. El gasto se registrara sin sesion.
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-rojo text-white hover:bg-rojo/90 h-10 text-sm font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ArrowDownCircle className="w-4 h-4 mr-1.5" />}
            Registrar Gasto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
