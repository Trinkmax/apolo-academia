'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  Bell,
  Scissors,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Vista general' },
  { href: '/cursos', label: 'Cursos', icon: BookOpen, description: 'Gestionar cohortes' },
  { href: '/alumnos', label: 'Alumnos', icon: Users, description: 'Inscripciones' },
  { href: '/talleres', label: 'Talleres', icon: Scissors, description: 'Practica y pagos' },
  { href: '/tesoreria', label: 'Tesoreria', icon: Wallet, description: 'Cobros y pagos' },
  { href: '/alertas', label: 'Alertas', icon: Bell, description: 'Tareas pendientes' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{
        background: 'linear-gradient(180deg, hsl(228 18% 6%) 0%, hsl(228 18% 4%) 100%)',
        borderRight: '1px solid hsl(var(--sidebar-border))',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center gold-glow shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(38 92% 56%), hsl(28 90% 48%))' }}
        >
          <Scissors className="w-5 h-5 text-black" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold tracking-widest" style={{ color: 'hsl(var(--primary))' }}>
            APOLO
          </span>
          <span className="text-[11px] font-medium tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            ACADEMIA
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, hsl(var(--sidebar-border)), transparent)' }} />

      {/* Section label */}
      <div className="px-5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
          Menu principal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, description }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`sidebar-item group ${isActive ? 'active' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'bg-transparent text-muted-foreground group-hover:bg-secondary/50 group-hover:text-foreground'
              }`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium leading-tight">{label}</span>
                <span className="block text-[10px] leading-tight opacity-50 mt-0.5">{description}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-primary/60 shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground/80 truncate">Admin</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
              Apolo Academia
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
