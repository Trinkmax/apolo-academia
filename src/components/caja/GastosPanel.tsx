// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Receipt,
  Search,
  ArrowDownCircle,
  Repeat,
  TrendingDown,
  DollarSign,
  Loader2,
  Plus,
} from 'lucide-react'
import type { CategoriaGasto } from '@/lib/supabase/types'
import { RegistrarGastoForm } from './RegistrarGastoForm'
import { GastosFijosManager } from './GastosFijosManager'
import { toast } from 'sonner'

interface GastosPanelProps {
  gastos: any[]
  categorias: CategoriaGasto[]
  sesionId: string | null
}

export function GastosPanel({ gastos, categorias, sesionId }: GastosPanelProps) {
  const [tab, setTab] = useState<'TODOS' | 'FIJO' | 'VARIABLE'>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos')
  const router = useRouter()

  const gastosFiltrados = gastos.filter(g => {
    if (tab !== 'TODOS' && g.tipo !== tab) return false
    if (categoriaFiltro !== 'todos' && g.categoria_id !== categoriaFiltro) return false
    if (busqueda && !g.concepto.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  const totalFijos = gastos.filter(g => g.tipo === 'FIJO').reduce((s, g) => s + Number(g.monto), 0)
  const totalVariables = gastos.filter(g => g.tipo === 'VARIABLE').reduce((s, g) => s + Number(g.monto), 0)
  const totalGeneral = totalFijos + totalVariables

  const tabs = [
    { key: 'TODOS', label: 'Todos', count: gastos.length },
    { key: 'FIJO', label: 'Fijos', count: gastos.filter(g => g.tipo === 'FIJO').length },
    { key: 'VARIABLE', label: 'Variables', count: gastos.filter(g => g.tipo === 'VARIABLE').length },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass overflow-hidden border border-rojo/20 stat-card-rojo transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Gastos</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-rojo/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rojo" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rojo tabular-nums">${totalGeneral.toLocaleString('es-AR')}</div>
          </CardContent>
        </Card>
        <Card className="glass overflow-hidden border border-amarillo/20 stat-card-amarillo transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gastos Fijos</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-amarillo/10 flex items-center justify-center">
                <Repeat className="w-4 h-4 text-amarillo" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amarillo tabular-nums">${totalFijos.toLocaleString('es-AR')}</div>
          </CardContent>
        </Card>
        <Card className="glass overflow-hidden border border-primary/20 stat-card-primary transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gastos Variables</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary tabular-nums">${totalVariables.toLocaleString('es-AR')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filters + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-card/50 border border-border/40">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label} <span className="text-[10px] opacity-60">({t.count})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar gasto..."
              className="bg-input/30 h-9 text-xs pl-9 w-full sm:w-48"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="bg-input/30 h-9 text-xs w-36">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {categorias.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fixed expenses manager (only when on FIJO tab) */}
      {tab === 'FIJO' && (
        <GastosFijosManager categorias={categorias.filter(c => c.tipo === 'FIJO')} sesionId={sesionId} />
      )}

      {/* Gastos list */}
      <div className="space-y-2">
        {gastosFiltrados.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
            <Receipt className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Sin gastos registrados</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Los gastos apareceran aqui al registrarlos.</p>
          </div>
        ) : (
          gastosFiltrados.map((gasto) => {
            const cat = gasto.categorias_gasto
            return (
              <div key={gasto.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 glass hover:border-border/60 transition-all">
                <div className={`w-8 h-8 rounded-lg bg-rojo/10 flex items-center justify-center shrink-0`}>
                  <ArrowDownCircle className="w-4 h-4 text-rojo" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium truncate">{gasto.concepto}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                      gasto.tipo === 'FIJO'
                        ? 'text-amarillo border-amarillo/30 bg-amarillo/8'
                        : 'text-primary border-primary/30 bg-primary/8'
                    }`}>
                      {gasto.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {cat && <span>{cat.nombre}</span>}
                    <span>{new Date(gasto.fecha).toLocaleDateString('es-AR')}</span>
                    {gasto.metodo_pago && gasto.metodo_pago !== 'efectivo' && (
                      <span className="text-primary/60">{gasto.metodo_pago}</span>
                    )}
                    {gasto.comprobante_numero && (
                      <span className="text-muted-foreground/60">{gasto.comprobante_numero}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-rojo tabular-nums shrink-0">
                  -${Number(gasto.monto).toLocaleString('es-AR')}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
