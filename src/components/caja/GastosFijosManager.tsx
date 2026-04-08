// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CalendarPlus, Loader2, Repeat } from 'lucide-react'
import type { CategoriaGasto } from '@/lib/supabase/types'

interface GastosFijosManagerProps {
  categorias: CategoriaGasto[]
  sesionId: string | null
}

const GASTOS_FIJOS_TEMPLATE = [
  { concepto: 'Alquiler', categoriaKey: 'Alquiler', monto: 0 },
  { concepto: 'Servicios (Luz/Gas/Internet)', categoriaKey: 'Servicios (Luz/Gas/Internet)', monto: 0 },
  { concepto: 'Sueldos', categoriaKey: 'Sueldos', monto: 0 },
  { concepto: 'Subscripciones', categoriaKey: 'Subscripciones', monto: 0 },
]

export function GastosFijosManager({ categorias, sesionId }: GastosFijosManagerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gastosFijos, setGastosFijos] = useState(
    GASTOS_FIJOS_TEMPLATE.map(t => ({
      ...t,
      categoriaId: categorias.find(c => c.nombre === t.categoriaKey)?.id || '',
      monto: '',
      incluir: true,
    }))
  )
  const router = useRouter()
  const supabase = createClient()

  const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  function toggleIncluir(idx: number) {
    setGastosFijos(prev => prev.map((g, i) => i === idx ? { ...g, incluir: !g.incluir } : g))
  }

  function updateMonto(idx: number, value: string) {
    setGastosFijos(prev => prev.map((g, i) => i === idx ? { ...g, monto: value } : g))
  }

  async function handleGenerar(e: React.FormEvent) {
    e.preventDefault()
    const aGenerar = gastosFijos.filter(g => g.incluir && g.monto && Number(g.monto) > 0)
    if (aGenerar.length === 0) {
      toast.error('Ingresa al menos un monto')
      return
    }

    setLoading(true)
    try {
      for (const gasto of aGenerar) {
        const { data: gastoData, error: gastoErr } = await supabase
          .from('gastos')
          .insert([{
            categoria_id: gasto.categoriaId,
            concepto: gasto.concepto,
            monto: Number(gasto.monto),
            tipo: 'FIJO',
            recurrente: true,
            frecuencia: 'MENSUAL',
            metodo_pago: 'efectivo',
            sesion_caja_id: sesionId,
          }])
          .select('id')
          .single()

        if (gastoErr) throw gastoErr

        await supabase.from('movimientos_caja').insert([{
          tipo: 'EGRESO',
          concepto: `[Fijo] ${gasto.concepto}`,
          monto: Number(gasto.monto),
          metodo_pago: 'efectivo',
          sesion_caja_id: sesionId,
          categoria_id: gasto.categoriaId,
          gasto_id: gastoData.id,
        }])
      }

      toast.success(`${aGenerar.length} gastos fijos registrados`, { description: mesActual })
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al generar gastos fijos', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-3 rounded-xl glass border border-amarillo/20 stat-card-amarillo">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amarillo/10 flex items-center justify-center shrink-0">
            <Repeat className="w-4 h-4 text-amarillo" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Gastos Fijos Mensuales</p>
            <p className="text-[11px] text-muted-foreground">Genera los gastos fijos de {mesActual}.</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-amarillo text-black hover:bg-amarillo/90 font-semibold h-9 text-xs shadow-lg shadow-amarillo/15" />}>
            <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
            Generar Mes
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px] glass border-border/50">
            <DialogHeader>
              <DialogTitle className="text-lg">Generar gastos fijos - {mesActual}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGenerar} className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">Ingresa los montos para cada gasto fijo. Destilda los que no correspondan este mes.</p>
              <div className="space-y-3">
                {gastosFijos.map((gasto, idx) => (
                  <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                    gasto.incluir ? 'border-border/40 bg-card/50' : 'border-border/20 bg-card/20 opacity-50'
                  }`}>
                    <button
                      type="button"
                      onClick={() => toggleIncluir(idx)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        gasto.incluir ? 'border-amarillo bg-amarillo text-black' : 'border-border/50'
                      }`}
                    >
                      {gasto.incluir && <span className="text-xs font-bold">✓</span>}
                    </button>
                    <span className="text-xs font-medium flex-1">{gasto.concepto}</span>
                    <Input
                      type="number"
                      placeholder="$0"
                      className="bg-input/30 h-8 text-xs tabular-nums w-28 text-right"
                      value={gasto.monto}
                      onChange={(e) => updateMonto(idx, e.target.value)}
                      disabled={!gasto.incluir}
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-amarillo text-black hover:bg-amarillo/90 h-10 text-sm font-semibold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CalendarPlus className="w-4 h-4 mr-1.5" />}
                Generar Gastos Fijos
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
