// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
} from 'lucide-react'
import type { SesionCaja, MovimientoCaja } from '@/lib/supabase/types'

interface SesionesPanelProps {
  sesiones: SesionCaja[]
  movimientos: MovimientoCaja[]
}

export function SesionesPanel({ sesiones, movimientos }: SesionesPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (sesiones.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
        <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Sin sesiones registradas</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Las sesiones apareceran aqui al abrir y cerrar la caja.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sesiones.map((sesion) => {
        const isExpanded = expandedId === sesion.id
        const sesionMovs = movimientos.filter(m => m.sesion_caja_id === sesion.id)
        const ingresos = sesionMovs.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0)
        const egresos = sesionMovs.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto), 0)
        const isCerrada = sesion.estado === 'CERRADA'
        const diferencia = sesion.diferencia ? Number(sesion.diferencia) : null

        return (
          <div key={sesion.id} className="rounded-xl border border-border/40 glass overflow-hidden transition-all hover:border-border/60">
            {/* Session header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : sesion.id)}
              className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isCerrada ? 'bg-primary/10' : 'bg-verde/10'
              }`}>
                {isCerrada ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Clock className="w-5 h-5 text-verde" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold">
                    {new Date(sesion.fecha_apertura).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    isCerrada
                      ? 'text-primary border-primary/30 bg-primary/8'
                      : 'text-verde border-verde/30 bg-verde/8'
                  }`}>
                    {sesion.estado}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>Inicial: ${Number(sesion.monto_inicial).toLocaleString('es-AR')}</span>
                  <span className="text-verde">+${ingresos.toLocaleString('es-AR')}</span>
                  <span className="text-rojo">-${egresos.toLocaleString('es-AR')}</span>
                  {isCerrada && diferencia !== null && (
                    <span className={`font-bold ${
                      diferencia === 0 ? 'text-verde' : diferencia > 0 ? 'text-amarillo' : 'text-rojo'
                    }`}>
                      Dif: {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {isCerrada && diferencia !== null && (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    diferencia === 0 ? 'bg-verde/10' : 'bg-amarillo/10'
                  }`}>
                    {diferencia === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-verde" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amarillo" />
                    )}
                  </div>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-border/40 px-4 sm:px-5 py-4 space-y-4">
                {/* Arqueo summary */}
                {isCerrada && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="px-3 py-2 rounded-lg bg-card/50 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inicial</p>
                      <p className="text-sm font-bold tabular-nums">${Number(sesion.monto_inicial).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-card/50 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Esperado</p>
                      <p className="text-sm font-bold text-primary tabular-nums">${Number(sesion.monto_cierre_esperado || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-card/50 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Real</p>
                      <p className="text-sm font-bold tabular-nums">${Number(sesion.monto_cierre_real || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className={`px-3 py-2 rounded-lg border ${
                      diferencia === 0 ? 'bg-verde/5 border-verde/20' :
                      diferencia !== null && diferencia > 0 ? 'bg-amarillo/5 border-amarillo/20' :
                      'bg-rojo/5 border-rojo/20'
                    }`}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Diferencia</p>
                      <p className={`text-sm font-bold tabular-nums ${
                        diferencia === 0 ? 'text-verde' :
                        diferencia !== null && diferencia > 0 ? 'text-amarillo' : 'text-rojo'
                      }`}>
                        {diferencia !== null ? `${diferencia >= 0 ? '+' : ''}$${diferencia.toLocaleString('es-AR')}` : '-'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(sesion.notas_apertura || sesion.notas_cierre) && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {sesion.notas_apertura && <p><span className="font-medium text-foreground/60">Apertura:</span> {sesion.notas_apertura}</p>}
                    {sesion.notas_cierre && <p><span className="font-medium text-foreground/60">Cierre:</span> {sesion.notas_cierre}</p>}
                  </div>
                )}

                {/* Movements in this session */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Movimientos ({sesionMovs.length})
                  </p>
                  {sesionMovs.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 py-4 text-center">Sin movimientos en esta sesion</p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {sesionMovs.map((mov) => (
                        <div key={mov.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card/30 border border-border/20">
                          {mov.tipo === 'INGRESO' ? (
                            <ArrowUpCircle className="w-3.5 h-3.5 text-verde shrink-0" />
                          ) : (
                            <ArrowDownCircle className="w-3.5 h-3.5 text-rojo shrink-0" />
                          )}
                          <span className="text-xs flex-1 truncate">{mov.concepto}</span>
                          <span className={`text-xs font-bold tabular-nums ${
                            mov.tipo === 'INGRESO' ? 'text-verde' : 'text-rojo'
                          }`}>
                            {mov.tipo === 'INGRESO' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
