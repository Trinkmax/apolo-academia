import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddPaymentForm } from '@/components/tesoreria/AddPaymentForm'
import { Wallet, CheckCircle2, Clock, AlertCircle, GraduationCap, Phone, TrendingUp, DollarSign } from 'lucide-react'

export default async function TesoreriaPage() {
  const supabase = await createClient()

  const { data: inscripciones, error } = await supabase
    .from('curso_inscripciones')
    .select(`
      *,
      alumnos (nombre_completo, telefono),
      cursos (nombre),
      pagos (monto, fecha_pago, tipo)
    `)
    .order('estado_pago', { ascending: false })

  if (error) {
    console.error('Tesoreria Error:', error)
  }

  const alDiaCount = inscripciones?.filter(i => i.estado_pago === 'AL_DIA').length || 0
  const senadoCount = inscripciones?.filter(i => i.estado_pago === 'SEÑADO').length || 0
  const pendienteCount = inscripciones?.filter(i => i.estado_pago === 'PENDIENTE').length || 0
  const deudorCount = inscripciones?.filter(i => i.estado_pago === 'DEUDOR').length || 0

  const totalRecaudado = inscripciones?.reduce((acc, ins: any) => {
    const pagos = ins.pagos?.reduce((sum: number, p: any) => sum + Number(p.monto), 0) || 0
    return acc + pagos
  }, 0) || 0

  const totalPactado = inscripciones?.reduce((acc, ins: any) => acc + Number(ins.monto_pactado), 0) || 0

  const stats = [
    {
      label: 'Al Dia',
      value: alDiaCount,
      icon: CheckCircle2,
      colorClass: 'text-verde',
      bgClass: 'stat-card-verde',
      borderClass: 'border-verde/20',
      iconBg: 'bg-verde/10',
      subtitle: 'Cuota completa abonada',
    },
    {
      label: 'Senados',
      value: senadoCount,
      icon: Clock,
      colorClass: 'text-amarillo',
      bgClass: 'stat-card-amarillo',
      borderClass: 'border-amarillo/20',
      iconBg: 'bg-amarillo/10',
      subtitle: 'Pago seña - Debe resto',
    },
    {
      label: 'Deudores',
      value: deudorCount,
      icon: AlertCircle,
      colorClass: 'text-rojo',
      bgClass: 'stat-card-rojo',
      borderClass: 'border-rojo/20',
      iconBg: 'bg-rojo/10',
      subtitle: 'Paso Clase 1 sin pagar',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-bold tracking-tight">Tesoreria</h1>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">El Semaforo</span>
        </div>
        <p className="text-muted-foreground text-sm">Control visual del estado financiero de cada alumno inscripto.</p>
        <div className="header-accent mt-4 w-24" />
      </div>

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
                <div className={`text-3xl font-bold ${stat.colorClass} tabular-nums`}>{stat.value}</div>
                <p className="text-[11px] text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue summary bar */}
      <div className="flex items-center justify-between px-5 py-3.5 rounded-xl glass border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Recaudacion total</p>
            <p className="text-lg font-bold text-foreground tabular-nums">${totalRecaudado.toLocaleString('es-AR')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Pactado total</p>
          <p className="text-lg font-bold text-muted-foreground tabular-nums">${totalPactado.toLocaleString('es-AR')}</p>
        </div>
        <div className="hidden md:block">
          <div className="progress-bar w-32">
            <div
              className="progress-bar-fill bg-primary"
              style={{ width: `${totalPactado > 0 ? Math.min((totalRecaudado / totalPactado) * 100, 100) : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center tabular-nums">
            {totalPactado > 0 ? Math.round((totalRecaudado / totalPactado) * 100) : 0}% cobrado
          </p>
        </div>
      </div>

      {/* Student rows */}
      <div className="space-y-3">
        {inscripciones?.map((ins: any) => {
          const alumno = ins.alumnos
          const curso = ins.cursos
          const totalAbonado = ins.pagos?.reduce((acc: number, p: any) => acc + Number(p.monto), 0) || 0
          const montoPactado = Number(ins.monto_pactado)
          const deuda = montoPactado - totalAbonado
          const progress = montoPactado > 0 ? Math.min((totalAbonado / montoPactado) * 100, 100) : 0

          let borderColor = 'border-border/40'
          let statusText = ''
          let statusColor = ''
          let bgGradient = ''

          switch (ins.estado_pago) {
            case 'AL_DIA':
              borderColor = 'border-verde/25'
              statusText = 'AL DIA'
              statusColor = 'text-verde border-verde/30 bg-verde/8'
              bgGradient = 'stat-card-verde'
              break
            case 'SEÑADO':
              borderColor = 'border-amarillo/25'
              statusText = 'SEÑADO'
              statusColor = 'text-amarillo border-amarillo/30 bg-amarillo/8'
              bgGradient = 'stat-card-amarillo'
              break
            case 'PENDIENTE':
              borderColor = 'border-amarillo/25'
              statusText = 'PARCIAL'
              statusColor = 'text-amarillo border-amarillo/30 bg-amarillo/8'
              bgGradient = 'stat-card-amarillo'
              break
            case 'DEUDOR':
              borderColor = 'border-rojo/25'
              statusText = 'DEUDOR'
              statusColor = 'text-rojo border-rojo/30 bg-rojo/8'
              bgGradient = 'stat-card-rojo'
              break
          }

          return (
            <div key={ins.id} className={`p-5 rounded-xl border ${borderColor} ${bgGradient} glass transition-all hover:shadow-md hover:shadow-black/5 hover:-translate-y-px flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
              {/* Student info */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  ins.estado_pago === 'AL_DIA' ? 'bg-verde/10 text-verde' :
                  ins.estado_pago === 'SEÑADO' || ins.estado_pago === 'PENDIENTE' ? 'bg-amarillo/10 text-amarillo' :
                  'bg-rojo/10 text-rojo'
                }`}>
                  {alumno?.nombre_completo?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="font-bold text-[15px] truncate">{alumno?.nombre_completo}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor} shrink-0`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-primary/60" />
                      {curso?.nombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {alumno?.telefono}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial info */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-[15px] font-bold text-foreground tabular-nums">${totalAbonado.toLocaleString('es-AR')}</span>
                    <span className="text-xs text-muted-foreground/50">/</span>
                    <span className="text-xs text-muted-foreground tabular-nums">${montoPactado.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="progress-bar w-28">
                    <div
                      className={`progress-bar-fill ${
                        progress >= 100 ? 'bg-verde' : progress > 40 ? 'bg-amarillo' : 'bg-rojo'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {deuda > 0 && (
                    <p className="text-[10px] text-rojo font-semibold mt-1 tabular-nums tracking-wide">
                      Resta: ${deuda.toLocaleString('es-AR')}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {ins.estado_pago !== 'AL_DIA' ? (
                    <AddPaymentForm
                      inscripcionId={ins.id}
                      montoPactado={montoPactado}
                      totalAbonado={totalAbonado}
                      alumnoId={ins.alumno_id}
                      cursoId={ins.curso_id}
                      alumnoNombre={alumno?.nombre_completo}
                      cursoNombre={curso?.nombre}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-verde/10 flex items-center justify-center border border-verde/20">
                      <CheckCircle2 className="w-4 h-4 text-verde" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {inscripciones?.length === 0 && (
          <div className="py-16 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
            <Wallet className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No hay inscriptos para cobrar todavia</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Los alumnos apareceran aqui cuando se inscriban.</p>
          </div>
        )}
      </div>
    </div>
  )
}
