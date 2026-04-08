// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import type { MovimientoCaja, CategoriaGasto } from '@/lib/supabase/types'

interface ReportesViewProps {
  movimientos: MovimientoCaja[]
  gastos: any[]
  categorias: CategoriaGasto[]
}

function getMonthRange(offset: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
  }
}

export function ReportesView({ movimientos, gastos, categorias }: ReportesViewProps) {
  const [periodo, setPeriodo] = useState<'mes' | 'mes_anterior' | 'trimestre'>('mes')

  const periodos = {
    mes: getMonthRange(0),
    mes_anterior: getMonthRange(-1),
    trimestre: (() => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 2)
      start.setDate(1)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        label: `${start.toLocaleDateString('es-AR', { month: 'short' })} - ${end.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}`,
      }
    })(),
  }

  const range = periodos[periodo]

  const movsFiltrados = useMemo(() =>
    movimientos.filter(m => m.fecha >= range.start && m.fecha <= range.end),
    [movimientos, range]
  )

  const gastosFiltrados = useMemo(() =>
    gastos.filter(g => g.fecha >= range.start && g.fecha <= range.end),
    [gastos, range]
  )

  const totalIngresos = movsFiltrados.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0)
  const totalEgresos = movsFiltrados.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto), 0)
  const balance = totalIngresos - totalEgresos

  // Mes anterior comparison
  const mesAnterior = getMonthRange(-1)
  const movsAnterior = movimientos.filter(m => m.fecha >= mesAnterior.start && m.fecha <= mesAnterior.end)
  const ingresosAnterior = movsAnterior.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0)
  const egresosAnterior = movsAnterior.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto), 0)

  const deltaIngresos = ingresosAnterior > 0 ? ((totalIngresos - ingresosAnterior) / ingresosAnterior * 100) : 0
  const deltaEgresos = egresosAnterior > 0 ? ((totalEgresos - egresosAnterior) / egresosAnterior * 100) : 0

  // Category breakdown
  const gastosPorCategoria = useMemo(() => {
    const map = new Map<string, { nombre: string; color: string; total: number }>()
    gastosFiltrados.forEach(g => {
      const cat = g.categorias_gasto
      if (!cat) return
      const existing = map.get(g.categoria_id) || { nombre: cat.nombre, color: cat.color || 'primary', total: 0 }
      existing.total += Number(g.monto)
      map.set(g.categoria_id, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [gastosFiltrados])

  const maxCategoriaTotal = gastosPorCategoria[0]?.total || 1

  // Income sources breakdown
  const ingresosPorFuente = useMemo(() => {
    const map = new Map<string, number>()
    movsFiltrados.filter(m => m.tipo === 'INGRESO').forEach(m => {
      let fuente = 'Otros'
      if (m.concepto.includes('Seña') || m.concepto.includes('Sena')) fuente = 'Señas'
      else if (m.concepto.includes('Cuota') || m.concepto.includes('Parcial')) fuente = 'Cuotas'
      else if (m.concepto.includes('Pago completo') || m.concepto.includes('Total')) fuente = 'Pagos completos'
      else if (m.concepto.includes('Taller')) fuente = 'Talleres'
      map.set(fuente, (map.get(fuente) || 0) + Number(m.monto))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [movsFiltrados])

  const maxIngresoFuente = ingresosPorFuente[0]?.[1] || 1

  const tabOptions = [
    { key: 'mes', label: periodos.mes.label },
    { key: 'mes_anterior', label: periodos.mes_anterior.label },
    { key: 'trimestre', label: 'Trimestre' },
  ]

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-1 p-1 rounded-xl bg-card/50 border border-border/40 w-fit">
        {tabOptions.map(t => (
          <button
            key={t.key}
            onClick={() => setPeriodo(t.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              periodo === t.key
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass overflow-hidden border border-verde/20 stat-card-verde transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ingresos</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-verde/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-verde" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-verde tabular-nums">${totalIngresos.toLocaleString('es-AR')}</div>
            {periodo === 'mes' && deltaIngresos !== 0 && (
              <div className={`flex items-center gap-1 mt-1 text-[11px] font-medium ${deltaIngresos > 0 ? 'text-verde' : 'text-rojo'}`}>
                {deltaIngresos > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(Math.round(deltaIngresos))}% vs mes anterior
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass overflow-hidden border border-rojo/20 stat-card-rojo transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Egresos</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-rojo/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rojo" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rojo tabular-nums">${totalEgresos.toLocaleString('es-AR')}</div>
            {periodo === 'mes' && deltaEgresos !== 0 && (
              <div className={`flex items-center gap-1 mt-1 text-[11px] font-medium ${deltaEgresos > 0 ? 'text-rojo' : 'text-verde'}`}>
                {deltaEgresos > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(Math.round(deltaEgresos))}% vs mes anterior
              </div>
            )}
          </CardContent>
        </Card>
        <Card className={`glass overflow-hidden border ${balance >= 0 ? 'border-primary/20 stat-card-primary' : 'border-rojo/20 stat-card-rojo'} transition-all duration-300 hover:-translate-y-0.5`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado</CardTitle>
              <div className={`w-8 h-8 rounded-xl ${balance >= 0 ? 'bg-primary/10' : 'bg-rojo/10'} flex items-center justify-center`}>
                <DollarSign className={`w-4 h-4 ${balance >= 0 ? 'text-primary' : 'text-rojo'}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold tabular-nums ${balance >= 0 ? 'text-primary' : 'text-rojo'}`}>
              {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString('es-AR')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {balance >= 0 ? 'Ganancia neta' : 'Perdida neta'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense breakdown by category */}
        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rojo" />
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gastosPorCategoria.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Sin gastos en este periodo</p>
            ) : (
              gastosPorCategoria.map((cat) => {
                const pct = totalEgresos > 0 ? (cat.total / totalEgresos * 100) : 0
                return (
                  <div key={cat.nombre} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{cat.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{Math.round(pct)}%</span>
                        <span className="font-bold text-rojo tabular-nums">${cat.total.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill bg-rojo"
                        style={{ width: `${(cat.total / maxCategoriaTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Income breakdown by source */}
        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-verde" />
              Ingresos por Fuente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingresosPorFuente.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Sin ingresos en este periodo</p>
            ) : (
              ingresosPorFuente.map(([fuente, total]) => {
                const pct = totalIngresos > 0 ? (total / totalIngresos * 100) : 0
                return (
                  <div key={fuente} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{fuente}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{Math.round(pct)}%</span>
                        <span className="font-bold text-verde tabular-nums">${total.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill bg-verde"
                        style={{ width: `${(total / maxIngresoFuente) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash flow - Monthly comparison */}
      {periodo === 'mes' && (
        <Card className="glass border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Comparacion con Mes Anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Ingresos</p>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground mb-1">Anterior</p>
                    <div className="progress-bar h-6 rounded-lg">
                      <div className="progress-bar-fill bg-verde/40 rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.min((ingresosAnterior / Math.max(totalIngresos, ingresosAnterior, 1)) * 100, 100)}%` }}>
                        <span className="text-[9px] font-bold text-verde">${ingresosAnterior.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Actual</p>
                  <div className="progress-bar h-6 rounded-lg">
                    <div className="progress-bar-fill bg-verde rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.min((totalIngresos / Math.max(totalIngresos, ingresosAnterior, 1)) * 100, 100)}%` }}>
                      <span className="text-[9px] font-bold text-white">${totalIngresos.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Egresos</p>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Anterior</p>
                  <div className="progress-bar h-6 rounded-lg">
                    <div className="progress-bar-fill bg-rojo/40 rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.min((egresosAnterior / Math.max(totalEgresos, egresosAnterior, 1)) * 100, 100)}%` }}>
                      <span className="text-[9px] font-bold text-rojo">${egresosAnterior.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Actual</p>
                  <div className="progress-bar h-6 rounded-lg">
                    <div className="progress-bar-fill bg-rojo rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.min((totalEgresos / Math.max(totalEgresos, egresosAnterior, 1)) * 100, 100)}%` }}>
                      <span className="text-[9px] font-bold text-white">${totalEgresos.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Resultado</p>
                <div className="flex flex-col gap-2 justify-center h-[calc(100%-1.5rem)]">
                  <div className="px-3 py-2 rounded-lg bg-card/50 border border-border/30">
                    <p className="text-[10px] text-muted-foreground">Anterior</p>
                    <p className={`text-sm font-bold tabular-nums ${(ingresosAnterior - egresosAnterior) >= 0 ? 'text-verde' : 'text-rojo'}`}>
                      {(ingresosAnterior - egresosAnterior) >= 0 ? '+' : '-'}${Math.abs(ingresosAnterior - egresosAnterior).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className={`px-3 py-2 rounded-lg border ${balance >= 0 ? 'bg-verde/5 border-verde/20' : 'bg-rojo/5 border-rojo/20'}`}>
                    <p className="text-[10px] text-muted-foreground">Actual</p>
                    <p className={`text-sm font-bold tabular-nums ${balance >= 0 ? 'text-verde' : 'text-rojo'}`}>
                      {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
