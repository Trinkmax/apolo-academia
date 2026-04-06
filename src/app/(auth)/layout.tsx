import Sidebar from '@/components/Sidebar'
import { GlobalAlertButton } from '@/components/alertas/GlobalAlertButton'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen noise">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
      <GlobalAlertButton />
    </div>
  )
}
