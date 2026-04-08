// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Scissors,
  Banknote,
  Plus,
  Search,
  Loader2,
  Check,
  User,
  Phone,
  Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { registrarMovimientoCaja } from '@/lib/caja-utils'
import { MetodoPagoSelector, METODO_ICONS, METODO_LABELS } from '@/components/shared/MetodoPagoSelector'

type TalleresPanelProps = {
  talleres: any[]
  alumnos: any[]
}

type FilterType = 'todos' | 'pendiente_pago' | 'pendiente_asistencia' | 'completados'

export function TalleresPanel({ talleres: initialTalleres, alumnos }: TalleresPanelProps) {
  const router = useRouter()
  const supabase = createClient()

  const [talleres, setTalleres] = useState(initialTalleres)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('todos')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('')
  const [createPagado, setCreatePagado] = useState(true)
  const [createMetodo, setCreateMetodo] = useState('efectivo')
  const [createCuentaId, setCreateCuentaId] = useState('')
  const [createMonto, setCreateMonto] = useState('5000')
  const [createLoading, setCreateLoading] = useState(false)
  const [alumnoSearch, setAlumnoSearch] = useState('')

  // Filter talleres
  const filtered = talleres.filter(t => {
    const alumnoName = t.alumnos?.nombre_completo?.toLowerCase() || ''
    const matchesSearch = !search || alumnoName.includes(search.toLowerCase())

    const matchesFilter =
      filter === 'todos' ? true :
      filter === 'pendiente_pago' ? !t.pagado :
      filter === 'pendiente_asistencia' ? !t.asistio :
      filter === 'completados' ? t.pagado && t.asistio :
      true

    return matchesSearch && matchesFilter
  })

  // Filtered alumnos for create form
  const filteredAlumnos = alumnos.filter(a =>
    !alumnoSearch || a.nombre_completo.toLowerCase().includes(alumnoSearch.toLowerCase())
  )

  async function crearTaller() {
    if (!selectedAlumnoId) {
      toast.error('Selecciona un alumno')
      return
    }
    setCreateLoading(true)
    try {
      const montoTaller = Number(createMonto) || 5000

      // Resolve cuenta name
      let cuentaNombre: string | null = null
      if (createPagado && createMetodo === 'transferencia' && createCuentaId) {
        const { data: cuentaData } = await supabase.from('cuentas_transferencia').select('nombre').eq('id', createCuentaId).single()
        cuentaNombre = cuentaData?.nombre || null
      }

      const insertData: any = {
        alumno_id: selectedAlumnoId,
        pagado: createPagado,
        asistio: false,
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: createPagado ? createMetodo : 'efectivo',
        monto: montoTaller,
        cuenta_destino: cuentaNombre,
      }
      const { data, error } = await supabase.from('talleres_practica').insert(insertData).select('*, alumnos(id, nombre_completo, telefono, talleres_realizados)').single()

      if (error) throw error

      if (data) {
        setTalleres(prev => [data, ...prev])
        toast.success('Taller creado')

        // Registrar movimiento en caja si pagado
        if (createPagado) {
          await registrarMovimientoCaja(supabase, {
            tipo: 'INGRESO',
            concepto: `Taller practica - ${data.alumnos?.nombre_completo || 'Alumno'}`,
            monto: montoTaller,
            alumno_id: selectedAlumnoId,
            metodo_pago: createMetodo,
          })
        }

        setSelectedAlumnoId('')
        setAlumnoSearch('')
        setCreateMonto('5000')
        setShowCreateForm(false)
      }
      router.refresh()
    } catch (err: any) {
      toast.error('Error al crear taller', { description: err.message })
    } finally {
      setCreateLoading(false)
    }
  }

  async function togglePagado(tallerId: string, current: boolean) {
    const taller = talleres.find(t => t.id === tallerId)
    const { error } = await supabase.from('talleres_practica').update({ pagado: !current }).eq('id', tallerId)
    if (error) {
      toast.error('Error', { description: error.message })
      return
    }
    setTalleres(prev => prev.map(t => t.id === tallerId ? { ...t, pagado: !current } : t))

    // Register caja movement when marking as paid
    if (!current && taller) {
      const { data: sesionAbierta } = await supabase
        .from('sesiones_caja')
        .select('id')
        .eq('estado', 'ABIERTA')
        .maybeSingle()

      await supabase.from('movimientos_caja').insert([{
        tipo: 'INGRESO',
        concepto: `Taller practica - ${taller.alumnos?.nombre_completo || 'Alumno'}`,
        monto: taller.monto || 5000,
        alumno_id: taller.alumno_id,
        sesion_caja_id: sesionAbierta?.id || null,
        metodo_pago: taller.metodo_pago || 'efectivo',
      }])
    }

    router.refresh()
  }

  async function toggleAsistio(tallerId: string, current: boolean, alumnoId: string) {
    const newAsistio = !current
    const { error } = await supabase.from('talleres_practica').update({ asistio: newAsistio }).eq('id', tallerId)
    if (error) {
      toast.error('Error', { description: error.message })
      return
    }
    setTalleres(prev => prev.map(t => t.id === tallerId ? { ...t, asistio: newAsistio } : t))

    // Update alumno talleres_realizados
    const alumnoTalleres = talleres.filter(t => t.alumno_id === alumnoId)
    const newCount = alumnoTalleres.filter(t => t.id === tallerId ? newAsistio : t.asistio).length
    await supabase.from('alumnos').update({ talleres_realizados: newCount }).eq('id', alumnoId)

    router.refresh()
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendiente_pago', label: 'Deben pago' },
    { key: 'pendiente_asistencia', label: 'Sin asistir' },
    { key: 'completados', label: 'Completados' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por alumno..."
            className="pl-9 h-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all border"
              style={filter === f.key ? {
                background: 'hsl(var(--primary) / 0.1)',
                borderColor: 'hsl(var(--primary) / 0.3)',
                color: 'hsl(var(--primary))',
              } : {
                background: 'transparent',
                borderColor: 'hsl(var(--border) / 0.3)',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Create button */}
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="h-10 bg-primary text-primary-foreground font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Nuevo taller
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="p-5 rounded-xl border space-y-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Crear nuevo taller
          </h3>

          {/* Alumno selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Alumno</label>
            <Input
              value={alumnoSearch}
              onChange={e => {
                setAlumnoSearch(e.target.value)
                setSelectedAlumnoId('')
              }}
              placeholder="Buscar alumno por nombre..."
              className="h-9 text-sm mb-2"
            />
            {alumnoSearch && !selectedAlumnoId && (
              <div className="max-h-32 overflow-y-auto rounded-lg border" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                {filteredAlumnos.slice(0, 8).map(a => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelectedAlumnoId(a.id)
                      setAlumnoSearch(a.nombre_completo)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/30 transition-colors flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                      {a.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                    <span>{a.nombre_completo}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{a.telefono}</span>
                  </button>
                ))}
                {filteredAlumnos.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No se encontraron alumnos</p>
                )}
              </div>
            )}
            {selectedAlumnoId && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                <Check className="w-3 h-3" />
                {alumnoSearch}
              </div>
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Monto ($)</label>
            <Input
              type="number"
              value={createMonto}
              onChange={e => setCreateMonto(e.target.value)}
              placeholder="5000"
              className="h-9 text-sm tabular-nums"
            />
          </div>

          {/* Estado del taller */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Estado de pago</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCreatePagado(true)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all"
                style={createPagado ? {
                  borderColor: 'hsl(var(--verde) / 0.4)',
                  background: 'hsl(var(--verde) / 0.1)',
                  color: 'hsl(var(--verde))',
                } : {
                  borderColor: 'hsl(var(--border) / 0.3)',
                  background: 'transparent',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-xs font-semibold">Pagado</span>
              </button>
              <button
                onClick={() => setCreatePagado(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all"
                style={!createPagado ? {
                  borderColor: 'hsl(var(--rojo) / 0.4)',
                  background: 'hsl(var(--rojo) / 0.1)',
                  color: 'hsl(var(--rojo))',
                } : {
                  borderColor: 'hsl(var(--border) / 0.3)',
                  background: 'transparent',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-xs font-semibold">Debe</span>
              </button>
            </div>
          </div>

          {/* Metodo de pago (si pagado) */}
          {createPagado && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Metodo de pago</label>
              <MetodoPagoSelector
                metodo={createMetodo}
                onMetodoChange={setCreateMetodo}
                cuentaId={createCuentaId}
                onCuentaChange={setCreateCuentaId}
              />
            </div>
          )}

          <Button
            onClick={crearTaller}
            disabled={createLoading || !selectedAlumnoId}
            className="w-full h-10 bg-primary text-primary-foreground font-semibold"
          >
            {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear taller'}
          </Button>
        </div>
      )}

      {/* Talleres list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <Scissors className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
          <h3 className="text-lg font-semibold">No hay talleres</h3>
          <p className="text-sm text-muted-foreground mt-1">Crea un taller con el boton "Nuevo taller"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl border transition-all"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)' }}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                {t.alumnos?.nombre_completo?.charAt(0)?.toUpperCase() || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{t.alumnos?.nombre_completo || 'Alumno'}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                  <span>{format(new Date(t.fecha + 'T12:00:00'), "d MMM yyyy", { locale: es })}</span>
                  <span className="font-semibold tabular-nums">${Number(t.monto || 5000).toLocaleString('es-AR')}</span>
                  {t.alumnos?.telefono && (
                    <span className="flex items-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" /> {t.alumnos.telefono}
                    </span>
                  )}
                </p>
              </div>

              {/* Asistio toggle */}
              <button
                onClick={() => toggleAsistio(t.id, t.asistio, t.alumno_id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all hover:scale-105"
                title={t.asistio ? 'Asistio - click para desmarcar' : 'Click para marcar asistencia'}
                style={t.asistio ? {
                  background: 'hsl(var(--verde) / 0.15)',
                  borderColor: 'hsl(var(--verde) / 0.4)',
                  color: 'hsl(var(--verde))',
                  boxShadow: '0 2px 8px hsl(var(--verde) / 0.15)',
                } : {
                  background: 'hsl(var(--card) / 0.6)',
                  borderColor: 'hsl(var(--border) / 0.3)',
                  color: 'hsl(var(--muted-foreground) / 0.2)',
                }}
              >
                <Scissors className="w-5 h-5" />
              </button>

              {/* Pagado toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => togglePagado(t.id, t.pagado)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all hover:scale-105"
                  title={t.pagado ? 'Pagado - click para desmarcar' : 'Click para marcar pagado'}
                  style={t.pagado ? {
                    background: 'hsl(var(--primary) / 0.15)',
                    borderColor: 'hsl(var(--primary) / 0.4)',
                    color: 'hsl(var(--primary))',
                    boxShadow: '0 2px 8px hsl(var(--primary) / 0.15)',
                  } : {
                    background: 'hsl(var(--card) / 0.6)',
                    borderColor: 'hsl(var(--border) / 0.3)',
                    color: 'hsl(var(--muted-foreground) / 0.2)',
                  }}
                >
                  <Banknote className="w-5 h-5" />
                </button>
                {t.pagado && (() => {
                  const MetodoIcon = METODO_ICONS[t.metodo_pago] || Wallet
                  return (
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/60" title={t.cuenta_destino ? `${METODO_LABELS[t.metodo_pago]} (${t.cuenta_destino})` : METODO_LABELS[t.metodo_pago]}>
                      <MetodoIcon className="w-3 h-3" />
                      <span>{METODO_LABELS[t.metodo_pago] || 'Efectivo'}</span>
                    </span>
                  )
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
