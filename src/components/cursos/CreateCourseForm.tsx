// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PlusCircle, Loader2, Calendar, Users, Info } from 'lucide-react'
import { addWeeks, format, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const NUM_CLASES = 5

function generateClassDates(fechaInicio: string): string[] {
  if (!fechaInicio) return []
  const start = new Date(fechaInicio + 'T12:00:00')
  if (isNaN(start.getTime())) return []
  const dates: string[] = []
  for (let i = 0; i < NUM_CLASES; i++) {
    const d = addWeeks(start, i)
    dates.push(format(d, 'yyyy-MM-dd'))
  }
  return dates
}

function getCupoForDay(fechaInicio: string): number {
  if (!fechaInicio) return 10
  const d = new Date(fechaInicio + 'T12:00:00')
  return getDay(d) === 6 ? 15 : 10 // Sabado = 15, resto = 10
}

function getDayName(fechaInicio: string): string {
  if (!fechaInicio) return ''
  const d = new Date(fechaInicio + 'T12:00:00')
  if (isNaN(d.getTime())) return ''
  return DAY_NAMES[getDay(d)]
}

const formSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  fecha_inicio: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de inicio invalida.' }),
  hora_inicio: z.string().min(1, { message: 'Hora inicio requerida.' }),
  hora_fin: z.string().min(1, { message: 'Hora fin requerida.' }),
  whatsapp_link: z.string().min(10, { message: 'Debe ser un enlace de WhatsApp valido.' }),
})

export function CreateCourseForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      fecha_inicio: '',
      hora_inicio: '18:00',
      hora_fin: '21:00',
      whatsapp_link: '',
    },
  })

  const fechaInicio = form.watch('fecha_inicio')
  const claseDates = useMemo(() => generateClassDates(fechaInicio), [fechaInicio])
  const cupo = useMemo(() => getCupoForDay(fechaInicio), [fechaInicio])
  const dayName = useMemo(() => getDayName(fechaInicio), [fechaInicio])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      const dates = generateClassDates(values.fecha_inicio)
      const fechaFin = dates[dates.length - 1]
      const dia = getDayName(values.fecha_inicio)
      const cupoMax = getCupoForDay(values.fecha_inicio)

      const dbPayload = {
        nombre: values.nombre,
        fecha_inicio: values.fecha_inicio,
        fecha_fin: fechaFin,
        dias_cursado: dia,
        horarios: `${values.hora_inicio} - ${values.hora_fin}`,
        whatsapp_link: values.whatsapp_link,
        cupo_maximo: cupoMax,
        clase_dates: dates,
      }

      const { data: curso, error } = await supabase
        .from('cursos')
        .insert([dbPayload])
        .select()
        .single()

      if (error) throw error

      // Auto-generate alerts for each class
      const alertas = []

      // Pre Clase 1: cobrar cuota + recordatorio inicio
      alertas.push({
        descripcion: `Cobrar cuota $70.000 - ${values.nombre}`,
        fecha_vencimiento: dates[0],
        tipo: 'curso',
        referencia_id: curso.id,
        color_etiqueta: 'naranja',
      })
      alertas.push({
        descripcion: `Enviar recordatorio inicio + material - ${values.nombre}`,
        fecha_vencimiento: dates[0],
        tipo: 'curso',
        referencia_id: curso.id,
        color_etiqueta: 'azul',
      })

      // Pre Clase 2: traer modelo
      alertas.push({
        descripcion: `Avisar traer modelo obligatorio - ${values.nombre}`,
        fecha_vencimiento: dates[1],
        tipo: 'curso',
        referencia_id: curso.id,
        color_etiqueta: 'azul',
      })

      // Pre Clase 5: evaluacion final
      alertas.push({
        descripcion: `Avisar evaluacion final - ${values.nombre}`,
        fecha_vencimiento: dates[4],
        tipo: 'curso',
        referencia_id: curso.id,
        color_etiqueta: 'azul',
      })

      // Post Clase 5: promo talleres
      const postDate = new Date(dates[4] + 'T12:00:00')
      postDate.setDate(postDate.getDate() + 1)
      alertas.push({
        descripcion: `Enviar promo talleres a egresados - ${values.nombre}`,
        fecha_vencimiento: format(postDate, 'yyyy-MM-dd'),
        tipo: 'curso',
        referencia_id: curso.id,
        color_etiqueta: 'naranja',
      })

      await supabase.from('alertas').insert(alertas)

      // Auto-generate communication checklist
      const checklistItems = [
        'Bienvenida enviada',
        'Material enviado',
        'Aviso modelo Clase 2',
        'Aviso evaluacion Clase 5',
        'Promo talleres enviada',
      ]
      await supabase.from('curso_comunicaciones_checklist').insert(
        checklistItems.map(item => ({
          curso_id: curso.id,
          tipo_mensaje: item,
        }))
      )

      toast.success('Curso creado con 5 clases automaticas', {
        description: `${curso.nombre} - ${dia}s de ${values.hora_inicio} a ${values.hora_fin}. Cupo: ${cupoMax}.`,
      })

      form.reset()
      setOpen(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (err: any) {
      toast.error('Error al crear el curso.', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 text-xs shadow-lg shadow-primary/15">
          <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
          Nuevo Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-lg">Nuevo Curso</DialogTitle>
          <DialogDescription className="text-xs">
            Selecciona la fecha de inicio y el sistema genera automaticamente 5 clases semanales consecutivas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Nombre del Curso</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Barberia Inicial - Marzo" className="bg-input/30 h-10 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Fecha de Inicio (Clase 1)</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-input/30 h-10 text-sm block w-full" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Se generan 5 clases consecutivas el mismo dia de la semana.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-generated preview */}
            {fechaInicio && claseDates.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {dayName}s - {NUM_CLASES} clases
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-primary">Cupo: {cupo}</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {claseDates.map((d, i) => (
                    <div key={d} className="text-center px-2 py-2 rounded-lg bg-card/80 border border-border/30">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Clase {i + 1}</p>
                      <p className="text-xs font-semibold mt-0.5 tabular-nums">
                        {format(new Date(d + 'T12:00:00'), 'dd/MM', { locale: es })}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Se crean alertas automaticas: cobro Clase 1, aviso modelo Clase 2, evaluacion Clase 5, y promo talleres post-curso.</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Hora Inicio</FormLabel>
                    <FormControl>
                      <Input type="time" className="bg-input/30 h-10 text-sm block w-full cursor-pointer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hora_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Hora Fin</FormLabel>
                    <FormControl>
                      <Input type="time" className="bg-input/30 h-10 text-sm block w-full cursor-pointer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="whatsapp_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Link Grupo de WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="https://chat.whatsapp.com/..." className="bg-input/30 h-10 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-3">
              <Button type="submit" disabled={submitting} className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/15">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Crear Curso ({NUM_CLASES} clases)
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
