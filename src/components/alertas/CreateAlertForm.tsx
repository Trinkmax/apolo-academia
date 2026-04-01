// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Alumno, Curso } from '@/lib/supabase/types'
import { BellRing, Loader2 } from 'lucide-react'

export function CreateAlertForm({ alumnos, cursos }: { alumnos: Alumno[], cursos: Curso[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState('')
  const [tipo, setTipo] = useState<'alumno' | 'curso'>('alumno')
  const [referenciaId, setReferenciaId] = useState('')
  const [color, setColor] = useState('naranja')

  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descripcion || !fecha || !referenciaId) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('alertas')
        .insert([{
          descripcion,
          fecha_vencimiento: fecha,
          tipo,
          referencia_id: referenciaId,
          color_etiqueta: color,
        }])

      if (error) throw error

      toast.success('Alerta programada correctamente')
      setOpen(false)
      setDescripcion('')
      setFecha('')
      setReferenciaId('')
      setTipo('alumno')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al guardar alerta', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 text-xs shadow-lg shadow-primary/15">
          <BellRing className="w-3.5 h-3.5 mr-1.5" />
          Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg">Programar Alerta</DialogTitle>
          <DialogDescription className="text-xs">Configura un recordatorio con fecha y prioridad.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Descripcion / Mensaje</Label>
            <Input
              placeholder="Ej: Cobrarle 20 mil a Juan..."
              className="bg-input/30 h-10 text-sm"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha a Notificar</Label>
              <Input
                type="date"
                className="bg-input/30 h-10 text-sm"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Prioridad</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-input/30 h-10 text-sm">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="azul">Informativo</SelectItem>
                  <SelectItem value="naranja">Cobros / Acciones</SelectItem>
                  <SelectItem value="rojo">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Vincular a</Label>
            <Select value={tipo} onValueChange={(val: 'alumno' | 'curso') => { setTipo(val); setReferenciaId('') }}>
              <SelectTrigger className="bg-input/30 h-10 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alumno">Un Alumno especifico</SelectItem>
                <SelectItem value="curso">Un Curso entero</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipo === 'alumno' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Seleccionar Alumno</Label>
              <Select value={referenciaId} onValueChange={setReferenciaId}>
                <SelectTrigger className="bg-input/30 h-10 text-sm">
                  <SelectValue placeholder="Elegir alumno..." />
                </SelectTrigger>
                <SelectContent>
                  {alumnos.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipo === 'curso' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Seleccionar Curso</Label>
              <Select value={referenciaId} onValueChange={setReferenciaId}>
                <SelectTrigger className="bg-input/30 h-10 text-sm">
                  <SelectValue placeholder="Elegir curso..." />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="pt-3">
            <Button type="submit" disabled={loading} className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/15">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Alerta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
