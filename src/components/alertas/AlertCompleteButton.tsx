'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AlertCompleteButton({ id, completada }: { id: string, completada: boolean | null }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    try {
      await supabase.from('alertas').update({ completada: !completada }).eq('id', id)
      toast.success(completada ? 'Restaurada' : 'Marcada como resuelta')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      disabled={loading}
      onClick={toggle}
      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 border group ${
        completada
          ? 'bg-verde/15 border-verde/30 text-verde hover:bg-verde/25'
          : 'bg-card border-border/50 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground'
      }`}
      title={completada ? 'Restaurar tarea' : 'Marcar como completada'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Check className={`w-4 h-4 transition-opacity duration-200 ${completada ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
      )}
    </button>
  )
}
