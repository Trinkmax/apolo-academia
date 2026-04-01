// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Curso } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageCircle, Check, UserPlus, Loader2, AlertTriangle, Users } from 'lucide-react'

type CursoConCupo = Curso & { inscriptos: number }

const formSchema = z.object({
  nombre_completo: z.string().min(2, 'Obligatorio'),
  telefono: z.string().min(6, 'Debe ser un numero valido (ej. +549...)'),
  curso_id: z.string().min(1, 'Selecciona un curso'),
  monto_pactado: z.coerce.number().min(0, 'Monto invalido'),
})

export function CreateSaleForm({ cursos, cursoCupoMap }: { cursos: Curso[], cursoCupoMap?: Record<string, number> }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saleComplete, setSaleComplete] = useState<{
    telefono: string;
    nombre: string;
    waLink: string;
    cursoNombre: string;
  } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_completo: '',
      telefono: '',
      curso_id: '',
      monto_pactado: 70000,
    },
  })

  const selectedCursoId = form.watch('curso_id')
  const selectedCurso = useMemo(() => cursos.find(c => c.id === selectedCursoId), [cursos, selectedCursoId])
  const inscriptos = cursoCupoMap?.[selectedCursoId] || 0
  const cupoMax = selectedCurso?.cupo_maximo || 10
  const cupoLleno = inscriptos >= cupoMax

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate cupo
    if (cupoLleno) {
      toast.error('Cupo lleno', { description: `Este curso ya tiene ${inscriptos}/${cupoMax} alumnos.` })
      return
    }

    setSubmitting(true)
    try {
      // Check if alumno already exists by phone
      const { data: existingAlumno } = await supabase
        .from('alumnos')
        .select('id')
        .eq('telefono', values.telefono)
        .maybeSingle()

      let alumnoId: string

      if (existingAlumno) {
        alumnoId = existingAlumno.id
      } else {
        const { data: alumno, error: alumnoErr } = await supabase
          .from('alumnos')
          .insert([{ nombre_completo: values.nombre_completo, telefono: values.telefono }])
          .select()
          .single()
        if (alumnoErr) throw alumnoErr
        alumnoId = alumno.id
      }

      // Check not already inscribed in this course
      const { data: existingIns } = await supabase
        .from('curso_inscripciones')
        .select('id')
        .eq('alumno_id', alumnoId)
        .eq('curso_id', values.curso_id)
        .maybeSingle()

      if (existingIns) {
        toast.error('Este alumno ya esta inscripto en este curso')
        setSubmitting(false)
        return
      }

      const { error: insErr } = await supabase
        .from('curso_inscripciones')
        .insert([{
          alumno_id: alumnoId,
          curso_id: values.curso_id,
          monto_pactado: values.monto_pactado,
          estado_pago: 'SEÑADO',
        }])

      if (insErr) throw insErr

      const curso = cursos.find(c => c.id === values.curso_id)

      toast.success('Inscripcion registrada - Estado: SEÑADO', {
        description: 'Debe abonar $70.000 en la Clase 1 para pasar a AL DIA.',
      })

      form.reset({ nombre_completo: '', telefono: '', curso_id: '', monto_pactado: 70000 })
      setSaleComplete({
        telefono: values.telefono,
        nombre: values.nombre_completo,
        waLink: curso!.whatsapp_link,
        cursoNombre: curso!.nombre,
      })
      router.refresh()

    } catch (err: any) {
      toast.error('Error al registrar', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleWaLink = () => {
    if (!saleComplete) return
    const numero = saleComplete.telefono.replace(/[^0-9]/g, '')
    const mensaje = `Hola ${saleComplete.nombre}! Bienvenido/a a la Academia Apolo al curso de ${saleComplete.cursoNombre}.\n\nAca te paso el enlace para unirte al grupo de WhatsApp del curso donde enviaremos todo el material y los avisos.\n\n${saleComplete.waLink}\n\nNos vemos pronto!`
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    setOpen(false)
    setSaleComplete(null)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setSaleComplete(null);
    }}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 text-xs shadow-lg shadow-primary/15">
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Inscribir Alumno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] glass border-border/50">
        {saleComplete ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 bg-verde/15 rounded-2xl flex items-center justify-center border border-verde/20">
              <Check className="w-7 h-7 text-verde" />
            </div>
            <DialogTitle className="text-xl">Inscripcion Exitosa</DialogTitle>
            <DialogDescription className="text-sm text-foreground/70 pb-2 max-w-sm">
              <strong className="text-foreground">{saleComplete.nombre}</strong> quedo inscripto con estado <span className="text-amarillo font-semibold">SEÑADO</span>. Enviale el link del grupo.
            </DialogDescription>
            <Button
              onClick={handleWaLink}
              className="w-full bg-[#25D366] hover:bg-[#20b858] text-white flex items-center gap-2 h-11 text-sm font-bold rounded-xl"
            >
              <MessageCircle className="w-5 h-5" />
              Enviar Link del Grupo
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Nueva Inscripcion</DialogTitle>
              <DialogDescription className="text-xs">
                El alumno inicia como SEÑADO ($15.000 inscripcion). Pasa a AL DIA al pagar la cuota completa ($70.000) en Clase 1.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
                <FormField
                  control={form.control}
                  name="nombre_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ignacio Baldovino" className="bg-input/30 h-10 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Telefono / WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="+54 9 11 1234 5678" className="bg-input/30 h-10 text-sm" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">Se utilizara para enviar el enlace via wa.me</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="curso_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Curso</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-input/30 h-10 text-sm">
                              <SelectValue placeholder="Elegir curso" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cursos.map(c => {
                              const ins = cursoCupoMap?.[c.id] || 0
                              const max = c.cupo_maximo || 10
                              const full = ins >= max
                              return (
                                <SelectItem key={c.id} value={c.id} disabled={full}>
                                  <span className={full ? 'text-muted-foreground' : ''}>
                                    {c.nombre} ({ins}/{max})
                                  </span>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monto_pactado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Cuota Total ($)</FormLabel>
                        <FormControl>
                          <Input type="number" className="bg-input/30 h-10 text-sm text-right tabular-nums" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cupo warning */}
                {selectedCursoId && cupoLleno && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rojo/10 border border-rojo/20 text-rojo text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Cupo lleno ({inscriptos}/{cupoMax}). No se puede inscribir.
                  </div>
                )}

                {selectedCursoId && !cupoLleno && inscriptos > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>{inscriptos}/{cupoMax} inscriptos - Quedan <strong className="text-foreground">{cupoMax - inscriptos}</strong> lugares</span>
                  </div>
                )}

                <DialogFooter className="pt-3">
                  <Button type="submit" disabled={submitting || cupoLleno} className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/15 disabled:opacity-40">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Inscribir (Señado $15.000)
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
