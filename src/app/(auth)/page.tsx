import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Bell, AlertCircle, ArrowUpRight, Wallet, Users, BookOpen, CalendarClock, TrendingUp, CircleDot } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: alertas } = await supabase.from('alertas').select('*').eq('completada', false).order('fecha_vencimiento', { ascending: true }).limit(5)
  const { data: cursos } = await supabase.from('cursos').select('id, nombre')
  const { data: inscripciones } = await supabase.from('curso_inscripciones').select('estado_pago')

  const deudoresCount = inscripciones?.filter(i => i.estado_pago === 'DEUDOR').length || 0
  const pendientesCount = inscripciones?.filter(i => i.estado_pago === 'PENDIENTE').length || 0
  const alDiaCount = inscripciones?.filter(i => i.estado_pago === 'AL_DIA').length || 0
  const totalCursos = cursos?.length || 0
  const totalAlumnos = inscripciones?.length || 0

  const stats = [
    {
      label: 'Deudores',
      value: deudoresCount,
      icon: AlertCircle,
      href: '/tesoreria',
      linkText: 'Ver tesoreria',
      colorClass: 'text-rojo',
      bgClass: 'stat-card-rojo',
      iconBg: 'bg-rojo/10',
      borderClass: 'border-rojo/20',
      trend: deudoresCount > 0 ? 'Requiere atencion' : 'Sin deudores',
    },
    {
      label: 'Cursos Activos',
      value: totalCursos,
      icon: BookOpen,
      href: '/cursos',
      linkText: 'Gestionar',
      colorClass: 'text-primary',
      bgClass: 'stat-card-primary',
      iconBg: 'bg-primary/10',
      borderClass: 'border-primary/20',
      trend: `${totalAlumnos} inscripciones`,
    },
    {
      label: 'Inscripciones',
      value: totalAlumnos,
      icon: Users,
      href: '/alumnos',
      linkText: 'Ver listado',
      colorClass: 'text-verde',
      bgClass: 'stat-card-verde',
      iconBg: 'bg-verde/10',
      borderClass: 'border-verde/20',
      trend: `${alDiaCount} al dia`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
          <CircleDot className="w-3 h-3 text-verde pulse-dot" />
          <span>Sistema activo</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Resumen diario de tu gestion en Apolo Academia.
        </p>
        <div className="header-accent mt-4 w-24" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`glass overflow-hidden border ${stat.borderClass} ${stat.bgClass} transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-[18px] h-[18px] ${stat.colorClass}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${stat.colorClass} mb-1 tabular-nums`}>{stat.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </span>
                  <Link href={stat.href} className={`text-xs font-medium ${stat.colorClass} hover:underline flex items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity`}>
                    {stat.linkText}
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Notifications */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amarillo/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amarillo" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Notificaciones Pendientes</h2>
              <p className="text-xs text-muted-foreground">{alertas?.length || 0} tareas por resolver</p>
            </div>
          </div>
          <Link href="/alertas" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {alertas?.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed rounded-xl bg-card/30">
              <CalendarClock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Todo al dia</p>
              <p className="text-muted-foreground/60 text-xs mt-1">No tienes tareas pendientes.</p>
            </div>
          ) : (
            alertas?.map((a: any) => {
              const isHoy = isToday(new Date(a.fecha_vencimiento))
              return (
                <Link key={a.id} href="/alertas">
                  <Card className={`glass card-hover h-full flex flex-col group ${isHoy ? 'border-primary/40 gold-glow-sm' : 'border-border/50'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                          {a.descripcion}
                        </CardTitle>
                        {isHoy && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-primary text-primary-foreground shrink-0 tracking-wide">
                            HOY
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {format(new Date(a.fecha_vencimiento), "d 'de' MMMM", { locale: es })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
