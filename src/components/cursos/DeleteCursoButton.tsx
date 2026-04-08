// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteCursoButton({ cursoId, cursoNombre }: { cursoId: string; cursoNombre: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setDeleting(true)
    try {
      // Get inscripcion IDs for this curso
      const { data: inscripciones } = await supabase
        .from('curso_inscripciones')
        .select('id')
        .eq('curso_id', cursoId)

      const insIds = inscripciones?.map(i => i.id) || []

      // Delete in order respecting FK constraints
      if (insIds.length > 0) {
        await supabase.from('asistencias').delete().in('inscripcion_id', insIds)
        await supabase.from('pagos').delete().in('inscripcion_id', insIds)
      }
      await supabase.from('movimientos_caja').delete().eq('curso_id', cursoId)
      await supabase.from('mensajes_enviados').delete().eq('curso_id', cursoId)
      await supabase.from('alertas').delete().eq('referencia_id', cursoId).eq('tipo', 'curso')
      await supabase.from('curso_comunicaciones_checklist').delete().eq('curso_id', cursoId)
      if (insIds.length > 0) {
        await supabase.from('curso_inscripciones').delete().in('id', insIds)
      }

      const { error } = await supabase.from('cursos').delete().eq('id', cursoId)
      if (error) throw error

      toast.success(`Curso "${cursoNombre}" eliminado`)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al eliminar curso', { description: err.message })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="w-8 h-8 bg-rojo/10 text-rojo hover:bg-rojo/20 rounded-lg transition-all flex items-center justify-center border border-rojo/20 hover:shadow-sm hover:shadow-rojo/10"
          title="Eliminar curso"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rojo" />
            Eliminar curso
          </AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara el curso <strong>{cursoNombre}</strong> junto con todas sus inscripciones, pagos, asistencias, comunicaciones y alertas. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-rojo text-white hover:bg-rojo/90"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
