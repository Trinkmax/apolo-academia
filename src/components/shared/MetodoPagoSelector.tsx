// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, ArrowRightLeft, CreditCard, Building2 } from 'lucide-react'

const METODO_ICONS: Record<string, any> = {
  efectivo: Wallet,
  transferencia: ArrowRightLeft,
  tarjeta: CreditCard,
}

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
}

type MetodoPagoSelectorProps = {
  metodo: string
  onMetodoChange: (metodo: string) => void
  cuentaId: string
  onCuentaChange: (cuentaId: string) => void
  size?: 'sm' | 'md'
}

export function MetodoPagoSelector({
  metodo,
  onMetodoChange,
  cuentaId,
  onCuentaChange,
  size = 'md',
}: MetodoPagoSelectorProps) {
  const [cuentas, setCuentas] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('cuentas_transferencia')
      .select('*')
      .eq('activa', true)
      .order('orden')
      .then(({ data }) => {
        if (data) setCuentas(data)
      })
  }, [])

  const isSmall = size === 'sm'

  return (
    <div className="space-y-2">
      {/* Method buttons */}
      <div className="flex gap-1.5">
        {(['efectivo', 'transferencia', 'tarjeta'] as const).map(m => {
          const Icon = METODO_ICONS[m]
          const isActive = metodo === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                onMetodoChange(m)
                if (m !== 'transferencia') onCuentaChange('')
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 font-medium transition-all ${
                isSmall ? 'py-2 text-[11px]' : 'py-2.5 text-xs'
              }`}
              style={isActive ? {
                background: 'hsl(var(--primary) / 0.1)',
                borderColor: 'hsl(var(--primary) / 0.4)',
                color: 'hsl(var(--primary))',
                boxShadow: '0 2px 8px hsl(var(--primary) / 0.1)',
              } : {
                background: 'transparent',
                borderColor: 'hsl(var(--border) / 0.3)',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              <Icon className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              {METODO_LABELS[m]}
            </button>
          )
        })}
      </div>

      {/* Account selector for transferencia */}
      {metodo === 'transferencia' && cuentas.length > 0 && (
        <div className={`rounded-xl border p-2.5 space-y-1.5`} style={{ borderColor: 'hsl(var(--primary) / 0.15)', background: 'hsl(var(--primary) / 0.03)' }}>
          <span className={`font-semibold text-muted-foreground flex items-center gap-1.5 ${isSmall ? 'text-[10px]' : 'text-[11px]'}`}>
            <Building2 className="w-3 h-3 text-primary/60" />
            Cuenta destino
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {cuentas.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCuentaChange(c.id === cuentaId ? '' : c.id)}
                className={`flex items-center gap-1.5 rounded-lg border font-medium transition-all ${
                  isSmall ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
                }`}
                style={cuentaId === c.id ? {
                  background: 'hsl(var(--primary) / 0.12)',
                  borderColor: 'hsl(var(--primary) / 0.4)',
                  color: 'hsl(var(--primary))',
                  boxShadow: '0 1px 4px hsl(var(--primary) / 0.1)',
                } : {
                  background: 'hsl(var(--card) / 0.8)',
                  borderColor: 'hsl(var(--border) / 0.4)',
                  color: 'hsl(var(--foreground) / 0.7)',
                }}
                title={c.descripcion || c.nombre}
              >
                <span
                  className={`rounded-md flex items-center justify-center font-bold shrink-0 ${
                    isSmall ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'
                  }`}
                  style={{
                    background: cuentaId === c.id ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted-foreground) / 0.08)',
                    color: cuentaId === c.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)',
                  }}
                >
                  {c.nombre.charAt(0).toUpperCase()}
                </span>
                <span>{c.nombre}</span>
                {c.descripcion && (
                  <span className="text-muted-foreground/40 hidden sm:inline">({c.descripcion})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {metodo === 'transferencia' && cuentas.length === 0 && (
        <div className="px-3 py-2.5 rounded-xl border border-dashed border-amarillo/20 bg-amarillo/5">
          <p className={`text-amarillo/80 ${isSmall ? 'text-[10px]' : 'text-[11px]'}`}>
            No hay cuentas configuradas. Agregalas en <span className="font-semibold">Configuracion</span>.
          </p>
        </div>
      )}
    </div>
  )
}

export { METODO_ICONS, METODO_LABELS }
