'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  Bell,
  Scissors,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { logout } from '@/app/(login)/login/actions'

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
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/30">
          <Image
            src="/logo-apolo.jpg"
            alt="Apolo by Monaco"
            width={44}
            height={44}
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold tracking-widest" style={{ color: 'hsl(var(--primary))' }}>
            APOLO
          </span>
          <span className="text-[11px] font-medium tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            ACADEMIA
          </span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
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
          <form action={logout}>
            <button
              type="submit"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              title="Cerrar sesion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 gap-3 lg:hidden z-50"
        style={{
          background: 'hsl(228 18% 6% / 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid hsl(var(--sidebar-border))',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-primary/30">
            <Image
              src="/logo-apolo.jpg"
              alt="Apolo"
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="text-sm font-bold tracking-widest" style={{ color: 'hsl(var(--primary))' }}>
            APOLO
          </span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop: fixed, mobile: slide-out */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, hsl(228 18% 6%) 0%, hsl(228 18% 4%) 100%)',
          borderRight: '1px solid hsl(var(--sidebar-border))',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
