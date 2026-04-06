// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Alumno, Curso } from '@/lib/supabase/types'
import { Loader2 } from 'lucide-react'

interface AlertFormFieldsProps {
  alumnos: Alumno[]
  cursos: Curso[]
  onSuccess?: () => void
  defaultTipo?: 'alumno' | 'curso'
  defaultReferenciaId?: string
}

export function AlertFormFields({ alumnos, cursos, onSuccess, defaultTipo, defaultReferenciaId }: AlertFormFieldsProps) {
  const [loading, setLoading] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState('')
  const [tipo, setTipo] = useState<'alumno' | 'curso'>(defaultTipo || 'alumno')
  const [referenciaId, setReferenciaId] = useState(defaultReferenciaId || '')
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
          origen: 'manual',
        }])

      if (error) throw error

      toast.success('Alerta programada correctamente')
      setDescripcion('')
      setFecha('')
      if (!defaultReferenciaId) setReferenciaId('')
      if (!defaultTipo) setTipo('alumno')
      router.refresh()
      onSuccess?.()
    } catch (err: any) {
      toast.error('Error al guardar alerta', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const lockReference = !!defaultTipo && !!defaultReferenciaId

  return (
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
              <SelectValue placeholder="Color">
                {(v: string) => v === 'azul' ? 'Informativo' : v === 'naranja' ? 'Cobros / Acciones' : v === 'rojo' ? 'Urgente' : 'Color'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="azul">Informativo</SelectItem>
              <SelectItem value="naranja">Cobros / Acciones</SelectItem>
              <SelectItem value="rojo">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!lockReference && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Vincular a</Label>
            <Select value={tipo} onValueChange={(val: 'alumno' | 'curso') => { setTipo(val); setReferenciaId('') }}>
              <SelectTrigger className="bg-input/30 h-10 text-sm">
                <SelectValue placeholder="Tipo">
                  {(v: string) => v === 'alumno' ? 'Un Alumno especifico' : 'Un Curso entero'}
                </SelectValue>
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
                  <SelectValue placeholder="Elegir alumno...">
                    {(v: string) => alumnos.find(a => a.id === v)?.nombre_completo || 'Elegir alumno...'}
                  </SelectValue>
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
                  <SelectValue placeholder="Elegir curso...">
                    {(v: string) => cursos.find(c => c.id === v)?.nombre || 'Elegir curso...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      <div className="pt-3">
        <Button type="submit" disabled={loading} className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/15">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Guardar Alerta
        </Button>
      </div>
    </form>
  )
}
