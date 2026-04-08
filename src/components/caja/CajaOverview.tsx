// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Plus,
  Lock,
  Receipt,
  History,
  BarChart3,
  Wallet,
} from 'lucide-react'
import type { SesionCaja, MovimientoCaja, CategoriaGasto } from '@/lib/supabase/types'
import { AbrirCajaDialog } from './AbrirCajaDialog'
import { CerrarCajaDialog } from './CerrarCajaDialog'
import { RegistrarMovimientoForm } from './RegistrarMovimientoForm'
import { RegistrarGastoForm } from './RegistrarGastoForm'
import Link from 'next/link'

interface CajaOverviewProps {
  sesionAbierta: SesionCaja | null
  movimientosHoy: MovimientoCaja[]
  ingresosHoy: number
  egresosHoy: number
  ingresosMes: number
  egresosMes: number
  gastosRecientes: any[]
  categorias: CategoriaGasto[]
}

export function CajaOverview({
  sesionAbierta,
  movimientosHoy,
  ingresosHoy,
  egresosHoy,
  ingresosMes,
  egresosMes,
  gastosRecientes,
  categorias,
}: CajaOverviewProps) {
  const router = useRouter()
  const balanceHoy = ingresosHoy - egresosHoy
  const balanceMes = ingresosMes - egresosMes

  const stats = [
    {
      label: 'Ingresos Hoy',
      value: ingresosHoy,
      icon: TrendingUp,
      colorClass: 'text-verde',
      borderClass: 'border-verde/20',
      bgClass: 'stat-card-verde',
      iconBg: 'bg-verde/10',
    },
    {
      label: 'Egresos Hoy',
      value: egresosHoy,
      icon: TrendingDown,
      colorClass: 'text-rojo',
      borderClass: 'border-rojo/20',
      bgClass: 'stat-card-rojo',
      iconBg: 'bg-rojo/10',
    },
    {
      label: 'Balance Hoy',
      value: balanceHoy,
      icon: DollarSign,
      colorClass: balanceHoy >= 0 ? 'text-primary' : 'text-rojo',
      borderClass: balanceHoy >= 0 ? 'border-primary/20' : 'border-rojo/20',
      bgClass: balanceHoy >= 0 ? 'stat-card-primary' : 'stat-card-rojo',
      iconBg: balanceHoy >= 0 ? 'bg-primary/10' : 'bg-rojo/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Session status bar */}
      {sesionAbierta ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 rounded-xl glass border border-verde/20 stat-card-verde">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-verde/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-verde" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Caja abierta desde</p>
              <p className="text-sm font-bold text-foreground">
                {new Date(sesionAbierta.fecha_apertura).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="text-left sm:text-right flex-1 sm:flex-initial">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1 justify-start sm:justify-end">
                <Wallet className="w-3 h-3" /> Efectivo inicial
              </p>
              <p className="text-sm font-bold text-verde tabular-nums">${Number(sesionAbierta.monto_inicial).toLocaleString('es-AR')}</p>
            </div>
            <CerrarCajaDialog
              sesionId={sesionAbierta.id}
              montoInicial={Number(sesionAbierta.monto_inicial)}
              ingresosEfectivo={movimientosHoy.filter(m => m.tipo === 'INGRESO' && (m.metodo_pago === 'efectivo' || !m.metodo_pago)).reduce((s, m) => s + Number(m.monto), 0)}
              egresosEfectivo={movimientosHoy.filter(m => m.tipo === 'EGRESO' && (m.metodo_pago === 'efectivo' || !m.metodo_pago)).reduce((s, m) => s + Number(m.monto), 0)}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 rounded-xl glass border border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rojo/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-rojo" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Caja cerrada</p>
              <p className="text-[11px] text-muted-foreground">Abri la caja para comenzar a registrar movimientos.</p>
            </div>
          </div>
          <AbrirCajaDialog />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`glass overflow-hidden border ${stat.borderClass} ${stat.bgClass} transition-all duration-300 hover:-translate-y-0.5`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`w-8 h-8 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${stat.colorClass}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.colorClass} tabular-nums`}>
                  ${Math.abs(stat.value).toLocaleString('es-AR')}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Monthly summary bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 rounded-xl glass border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Balance del Mes</p>
            <p className={`text-lg font-bold tabular-nums ${balanceMes >= 0 ? 'text-verde' : 'text-rojo'}`}>
              {balanceMes >= 0 ? '+' : '-'}${Math.abs(balanceMes).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-[11px] text-verde uppercase tracking-wider font-medium">Ingresos</p>
            <p className="text-sm font-bold text-verde tabular-nums">${ingresosMes.toLocaleString('es-AR')}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] text-rojo uppercase tracking-wider font-medium">Egresos</p>
            <p className="text-sm font-bold text-rojo tabular-nums">${egresosMes.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* Quick actions + Recent movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones rapidas</h3>
          <div className="space-y-2">
            <RegistrarMovimientoForm tipo="INGRESO" sesionId={sesionAbierta?.id || null} categorias={categorias} />
            <RegistrarGastoForm sesionId={sesionAbierta?.id || null} categorias={categorias} />
            <Link href="/caja/sesiones" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 glass hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <History className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Historial de sesiones</span>
            </Link>
            <Link href="/caja/gastos" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 glass hover:border-amarillo/30 hover:bg-amarillo/5 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-amarillo/10 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-amarillo" />
              </div>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Gestionar gastos</span>
            </Link>
            <Link href="/caja/reportes" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 glass hover:border-verde/30 hover:bg-verde/5 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-verde/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-verde" />
              </div>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">Ver reportes</span>
            </Link>
          </div>
        </div>

        {/* Recent movements */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Movimientos de Hoy</h3>
          <div className="space-y-2">
            {movimientosHoy.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
                <DollarSign className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Sin movimientos hoy</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Los movimientos apareceran aqui al registrarlos.</p>
              </div>
            ) : (
              movimientosHoy.slice(0, 15).map((mov) => (
                <div key={mov.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 glass hover:border-border/60 transition-all">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    mov.tipo === 'INGRESO' ? 'bg-verde/10' : 'bg-rojo/10'
                  }`}>
                    {mov.tipo === 'INGRESO' ? (
                      <ArrowUpCircle className="w-4 h-4 text-verde" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4 text-rojo" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mov.concepto}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(mov.creado_en || mov.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {mov.metodo_pago && mov.metodo_pago !== 'efectivo' && (
                        <span className="ml-2 text-primary/60">{mov.metodo_pago}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${
                    mov.tipo === 'INGRESO' ? 'text-verde' : 'text-rojo'
                  }`}>
                    {mov.tipo === 'INGRESO' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-AR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
