import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Apolo Academia | Gestion de Barberia',
  description: 'Sistema de gestion integral para Academia de Barberia Apolo. Cursos, alumnos, pagos y comunicaciones.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen noise">
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen">
            <div className="p-8 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
