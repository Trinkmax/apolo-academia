// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, GripVertical, Bell } from 'lucide-react'
import type { AlertaPlantillaDefecto } from '@/lib/supabase/types'

const ANCHOR_LABELS: Record<string, string> = {
  clase_1: 'Clase 1',
  clase_2: 'Clase 2',
  clase_3: 'Clase 3',
  clase_4: 'Clase 4',
  clase_5: 'Clase 5',
  post_ultima_clase: 'Post ultima clase',
  fecha_inicio: 'Fecha de inicio',
  fecha_fin: 'Fecha de fin',
}

const COLOR_LABELS: Record<string, string> = {
  azul: 'Informativo',
  naranja: 'Cobros / Acciones',
  rojo: 'Urgente',
}

const COLOR_CLASSES: Record<string, string> = {
  azul: 'bg-azul/10 text-azul border-azul/20',
  naranja: 'bg-naranja/10 text-naranja border-naranja/20',
  rojo: 'bg-rojo/10 text-rojo border-rojo/20',
}

interface AlertTemplateManagerProps {
  plantillas: AlertaPlantillaDefecto[]
}

export function AlertTemplateManager({ plantillas: initialPlantillas }: AlertTemplateManagerProps) {
  const [plantillas, setPlantillas] = useState(initialPlantillas)
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [descripcion, setDescripcion] = useState('')
  const [anchor, setAnchor] = useState('clase_1')
  const [offsetDias, setOffsetDias] = useState(0)
  const [color, setColor] = useState('azul')

  const supabase = createClient()
  const router = useRouter()

  function openNew() {
    setEditingId(null)
    setDescripcion('')
    setAnchor('clase_1')
    setOffsetDias(0)
    setColor('azul')
    setEditOpen(true)
  }

  function openEdit(p: AlertaPlantillaDefecto) {
    setEditingId(p.id)
    setDescripcion(p.descripcion_template)
    setAnchor(p.anchor)
    setOffsetDias(p.offset_dias)
    setColor(p.color_etiqueta)
    setEditOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!descripcion) {
      toast.error('La descripcion es obligatoria')
      return
    }
    setLoading(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('alerta_plantillas_defecto')
          .update({
            descripcion_template: descripcion,
            anchor,
            offset_dias: offsetDias,
            color_etiqueta: color,
          })
          .eq('id', editingId)
        if (error) throw error
        setPlantillas(prev => prev.map(p => p.id === editingId ? { ...p, descripcion_template: descripcion, anchor, offset_dias: offsetDias, color_etiqueta: color } : p))
        toast.success('Plantilla actualizada')
      } else {
        const maxOrden = plantillas.reduce((max, p) => Math.max(max, p.orden), 0)
        const { data, error } = await supabase
          .from('alerta_plantillas_defecto')
          .insert({
            descripcion_template: descripcion,
            anchor,
            offset_dias: offsetDias,
            color_etiqueta: color,
            orden: maxOrden + 1,
          })
          .select()
          .single()
        if (error) throw error
        setPlantillas(prev => [...prev, data])
        toast.success('Plantilla creada')
      }
      setEditOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al guardar', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, currentValue: boolean | null) {
    const newValue = !currentValue
    setPlantillas(prev => prev.map(p => p.id === id ? { ...p, activa: newValue } : p))
    const { error } = await supabase
      .from('alerta_plantillas_defecto')
      .update({ activa: newValue })
      .eq('id', id)
    if (error) {
      toast.error('Error al cambiar estado')
      setPlantillas(prev => prev.map(p => p.id === id ? { ...p, activa: currentValue } : p))
    }
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const { error } = await supabase.from('alerta_plantillas_defecto').delete().eq('id', id)
      if (error) throw error
      setPlantillas(prev => prev.filter(p => p.id !== id))
      toast.success('Plantilla eliminada')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al eliminar', { description: err.message })
    } finally {
      setDeleting(null)
    }
  }

  function formatOffset(anchor: string, offset: number): string {
    const anchorLabel = ANCHOR_LABELS[anchor] || anchor
    if (offset === 0) return `El dia de ${anchorLabel}`
    if (offset > 0) return `${offset} dia${offset > 1 ? 's' : ''} despues de ${anchorLabel}`
    return `${Math.abs(offset)} dia${Math.abs(offset) > 1 ? 's' : ''} antes de ${anchorLabel}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 text-xs shadow-lg shadow-primary/15">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Nueva Plantilla
        </Button>
      </div>

      {plantillas.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border/50 bg-card/30">
          <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No hay plantillas configuradas</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Crea plantillas para que se generen automaticamente al crear un curso.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {plantillas
            .sort((a, b) => a.orden - b.orden)
            .map((p) => (
            <Card key={p.id} className={`glass card-hover transition-opacity ${!p.activa ? 'opacity-50' : ''}`}>
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0 hidden sm:block" />

                <div className={`w-2 h-8 rounded-full shrink-0 ${
                  p.color_etiqueta === 'naranja' ? 'bg-naranja' : p.color_etiqueta === 'rojo' ? 'bg-rojo' : 'bg-azul'
                }`} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.descripcion_template}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${COLOR_CLASSES[p.color_etiqueta] || COLOR_CLASSES.azul}`}>
                      {COLOR_LABELS[p.color_etiqueta] || p.color_etiqueta}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatOffset(p.anchor, p.offset_dias)}
                    </span>
                  </div>
                </div>

                <Switch
                  checked={p.activa !== false}
                  onCheckedChange={() => handleToggle(p.id, p.activa)}
                />

                <button
                  onClick={() => openEdit(p)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rojo/10 transition-colors text-muted-foreground hover:text-rojo shrink-0"
                >
                  {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / Create dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px] glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
            <DialogDescription className="text-xs">
              Usa {'{curso_nombre}'} en la descripcion para insertar el nombre del curso automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Descripcion de la alerta</Label>
              <Input
                placeholder="Ej: Cobrar cuota $70.000 - {curso_nombre}"
                className="bg-input/30 h-10 text-sm"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Anclaje (evento base)</Label>
                <Select value={anchor} onValueChange={setAnchor}>
                  <SelectTrigger className="bg-input/30 h-10 text-sm">
                    <SelectValue placeholder="Ancla">
                      {(v: string) => ANCHOR_LABELS[v] || v}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ANCHOR_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Dias de offset</Label>
                <Input
                  type="number"
                  className="bg-input/30 h-10 text-sm"
                  value={offsetDias}
                  onChange={(e) => setOffsetDias(parseInt(e.target.value) || 0)}
                />
                <p className="text-[10px] text-muted-foreground">0 = mismo dia, + = despues, - = antes</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Prioridad / Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-input/30 h-10 text-sm">
                  <SelectValue placeholder="Color">
                    {(v: string) => COLOR_LABELS[v] || v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COLOR_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-3">
              <Button type="submit" disabled={loading} className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/15">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? 'Guardar Cambios' : 'Crear Plantilla'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
