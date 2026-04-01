// @ts-nocheck
'use client'

import { useState } from 'react'
import { AlumnoProfileDialog } from './AlumnoProfileDialog'
import { Phone } from 'lucide-react'

type Inscripcion = {
  id: string
  estado_pago: string
  alumnos: {
    id: string
    nombre_completo: string
    telefono: string
  }
}

type CursoAlumnosListProps = {
  inscripciones: Inscripcion[]
  cursoId: string
  cursoNombre: string
  claseDates: string[] | null
}

export function CursoAlumnosList({ inscripciones, cursoId, cursoNombre, claseDates }: CursoAlumnosListProps) {
  const [activeIns, setActiveIns] = useState<Inscripcion | null>(null)

  if (inscripciones.length === 0) {
    return <p className="text-xs text-muted-foreground/60 italic">Sin alumnos inscriptos aun.</p>
  }

  return (
    <>
      <div className="space-y-1.5">
        {inscripciones.map((ins) => {
          const alumno = ins.alumnos
          if (!alumno) return null
          const statusColor =
            ins.estado_pago === 'AL_DIA' ? 'bg-verde' :
            ins.estado_pago === 'SEÑADO' ? 'bg-amarillo' :
            ins.estado_pago === 'DEUDOR' ? 'bg-rojo' :
            'bg-muted-foreground/30'

          return (
            <button
              key={ins.id}
              type="button"
              onClick={() => setActiveIns(ins)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer text-left group"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                {alumno.nombre_completo?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-xs font-medium flex-1 truncate group-hover:text-primary transition-colors">
                {alumno.nombre_completo}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />
                {alumno.telefono}
              </span>
            </button>
          )
        })}
      </div>

      {activeIns && (
        <AlumnoProfileDialog
          open={!!activeIns}
          onOpenChange={(open) => { if (!open) setActiveIns(null) }}
          alumnoId={activeIns.alumnos.id}
          alumnoNombre={activeIns.alumnos.nombre_completo}
          alumnoTelefono={activeIns.alumnos.telefono}
          inscripcionId={activeIns.id}
          cursoId={cursoId}
          cursoNombre={cursoNombre}
          estadoPago={activeIns.estado_pago}
          claseDates={claseDates}
        />
      )}
    </>
  )
}
