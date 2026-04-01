'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ComunicacionChecklist } from '@/lib/supabase/types'

export function CourseChecklist({ items = [], cursoId }: { items: ComunicacionChecklist[], cursoId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleChecklist = async (id: string, currentStatus: boolean | null) => {
    setLoadingId(id)
    try {
      const { error } = await supabase
        .from('curso_comunicaciones_checklist')
        .update({
          completado: !currentStatus,
          fecha_completado: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error

      toast.success(!currentStatus ? 'Marcado como completado' : 'Marcado como pendiente')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al actualizar', { description: err.message })
    } finally {
      setLoadingId(null)
    }
  }

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground/60 italic">No hay mensajes configurados.</p>
  }

  const sortedItems = [...items].sort((a, b) => a.tipo_mensaje.localeCompare(b.tipo_mensaje))

  return (
    <div className="space-y-2">
      {sortedItems.map((item) => (
        <button
          key={item.id}
          disabled={loadingId === item.id}
          onClick={() => toggleChecklist(item.id, item.completado)}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 group ${
            item.completado
              ? 'bg-verde/8 border-verde/20 hover:bg-verde/12'
              : 'bg-card/50 border-border/40 hover:border-primary/30 hover:bg-card'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-200 ${
               item.completado
                 ? 'bg-verde border-verde text-background'
                 : 'border-muted-foreground/30 group-hover:border-primary/50'
            }`}>
              {loadingId === item.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : item.completado ? (
                <Check className="w-3 h-3" />
              ) : null}
            </div>
            <span className={`text-xs font-medium ${item.completado ? 'text-foreground/80' : 'text-muted-foreground'}`}>
              {item.tipo_mensaje}
            </span>
          </div>

          {item.completado && item.fecha_completado && (
            <span className="text-[10px] text-verde/70 tabular-nums">
              {new Date(item.fecha_completado).toLocaleDateString()}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
