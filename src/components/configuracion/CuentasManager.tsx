// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  Building2,
  Banknote,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type CuentasManagerProps = {
  cuentas: any[]
}

export function CuentasManager({ cuentas: initialCuentas }: CuentasManagerProps) {
  const router = useRouter()
  const supabase = createClient()

  const [cuentas, setCuentas] = useState(initialCuentas)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function crearCuenta() {
    if (!nombre.trim()) {
      toast.error('Ingresa un nombre para la cuenta')
      return
    }
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('cuentas_transferencia')
        .insert({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          orden: cuentas.length,
        })
        .select()
        .single()

      if (error) throw error

      setCuentas(prev => [...prev, data])
      toast.success('Cuenta agregada')
      setNombre('')
      setDescripcion('')
      setShowForm(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al crear cuenta', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function eliminarCuenta(id: string) {
    setDeletingId(id)
    try {
      const { error } = await supabase.from('cuentas_transferencia').delete().eq('id', id)
      if (error) throw error

      setCuentas(prev => prev.filter(c => c.id !== id))
      toast.success('Cuenta eliminada')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al eliminar', { description: err.message })
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleActiva(id: string, current: boolean) {
    const { error } = await supabase.from('cuentas_transferencia').update({ activa: !current }).eq('id', id)
    if (error) {
      toast.error('Error', { description: error.message })
      return
    }
    setCuentas(prev => prev.map(c => c.id === id ? { ...c, activa: !current } : c))
    router.refresh()
  }

  const activas = cuentas.filter(c => c.activa).length

  return (
    <Card className="glass border-border/40 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/30" style={{ background: 'hsl(var(--surface-2) / 0.3)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cuentas de transferencia</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cuentas.length === 0
                  ? 'Configura las cuentas donde recibis transferencias.'
                  : `${activas} cuenta${activas !== 1 ? 's' : ''} activa${activas !== 1 ? 's' : ''} de ${cuentas.length} total`}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="h-10 px-4 bg-primary text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/15"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Nueva cuenta
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Create form */}
        {showForm && (
          <div className="p-5 rounded-xl border-2 border-dashed border-primary/20 space-y-4" style={{ background: 'hsl(var(--primary) / 0.02)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Agregar cuenta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nombre de la cuenta</label>
                <Input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Mercado Pago, Banco Nacion..."
                  className="h-10 text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Detalle / CBU / Alias (opcional)</label>
                <Input
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Ej: CVU 000017..., alias apolo.mp"
                  className="h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={crearCuenta}
                disabled={saving || !nombre.trim()}
                className="h-10 px-6 bg-primary text-primary-foreground font-semibold text-xs"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
                Guardar cuenta
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setNombre(''); setDescripcion('') }}
                className="h-10 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {cuentas.length === 0 && !showForm ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <Banknote className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No hay cuentas configuradas</p>
            <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-xs mx-auto">
              Agrega tus cuentas bancarias o billeteras virtuales para que aparezcan automaticamente al registrar pagos por transferencia.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="mt-5 h-9 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar primera cuenta
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {cuentas.map((cuenta, i) => (
              <div
                key={cuenta.id}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all hover:border-border/60 ${
                  !cuenta.activa ? 'opacity-40' : ''
                }`}
                style={{
                  background: cuenta.activa ? 'hsl(var(--card) / 0.6)' : 'transparent',
                  borderColor: cuenta.activa ? 'hsl(var(--border) / 0.5)' : 'hsl(var(--border) / 0.2)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{
                    background: cuenta.activa ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted-foreground) / 0.05)',
                    color: cuenta.activa ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)',
                  }}
                >
                  {cuenta.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{cuenta.nombre}</p>
                  {cuenta.descripcion ? (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{cuenta.descripcion}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/40 mt-0.5">Sin detalle</p>
                  )}
                </div>

                {/* Status badge */}
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg shrink-0"
                  style={cuenta.activa ? {
                    background: 'hsl(var(--verde) / 0.1)',
                    color: 'hsl(var(--verde))',
                  } : {
                    background: 'hsl(var(--muted-foreground) / 0.05)',
                    color: 'hsl(var(--muted-foreground) / 0.4)',
                  }}
                >
                  {cuenta.activa ? 'Activa' : 'Inactiva'}
                </span>

                {/* Toggle active */}
                <button
                  onClick={() => toggleActiva(cuenta.id, cuenta.activa)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all hover:scale-105 shrink-0"
                  title={cuenta.activa ? 'Desactivar' : 'Activar'}
                  style={cuenta.activa ? {
                    background: 'hsl(var(--verde) / 0.1)',
                    borderColor: 'hsl(var(--verde) / 0.3)',
                    color: 'hsl(var(--verde))',
                  } : {
                    background: 'transparent',
                    borderColor: 'hsl(var(--border) / 0.3)',
                    color: 'hsl(var(--muted-foreground) / 0.4)',
                  }}
                >
                  {cuenta.activa ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-rojo/15 text-rojo/40 hover:bg-rojo/10 hover:text-rojo hover:border-rojo/30 transition-all shrink-0"
                      title="Eliminar cuenta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar cuenta</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminara la cuenta <strong>{cuenta.nombre}</strong>. Los pagos ya registrados con esta cuenta no se veran afectados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => eliminarCuenta(cuenta.id)}
                        disabled={deletingId === cuenta.id}
                        className="bg-rojo text-white hover:bg-rojo/90"
                      >
                        {deletingId === cuenta.id ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
