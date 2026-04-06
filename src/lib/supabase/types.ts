export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerta_plantillas_defecto: {
        Row: {
          id: string
          descripcion_template: string
          offset_dias: number
          anchor: string
          color_etiqueta: string
          activa: boolean | null
          orden: number
          creado_en: string | null
        }
        Insert: {
          id?: string
          descripcion_template: string
          offset_dias?: number
          anchor?: string
          color_etiqueta?: string
          activa?: boolean | null
          orden?: number
          creado_en?: string | null
        }
        Update: {
          id?: string
          descripcion_template?: string
          offset_dias?: number
          anchor?: string
          color_etiqueta?: string
          activa?: boolean | null
          orden?: number
          creado_en?: string | null
        }
        Relationships: []
      }
      alertas: {
        Row: {
          color_etiqueta: string
          completada: boolean | null
          creado_en: string | null
          descripcion: string
          fecha_vencimiento: string
          id: string
          origen: string
          referencia_id: string
          tipo: string
        }
        Insert: {
          color_etiqueta?: string
          completada?: boolean | null
          creado_en?: string | null
          descripcion: string
          fecha_vencimiento: string
          id?: string
          origen?: string
          referencia_id: string
          tipo: string
        }
        Update: {
          color_etiqueta?: string
          completada?: boolean | null
          creado_en?: string | null
          descripcion?: string
          fecha_vencimiento?: string
          id?: string
          origen?: string
          referencia_id?: string
          tipo?: string
        }
        Relationships: []
      }
      alumnos: {
        Row: {
          creado_en: string | null
          email: string | null
          id: string
          nombre_completo: string
          telefono: string
          talleres_realizados: number
        }
        Insert: {
          creado_en?: string | null
          email?: string | null
          id?: string
          nombre_completo: string
          telefono: string
          talleres_realizados?: number
        }
        Update: {
          creado_en?: string | null
          email?: string | null
          id?: string
          nombre_completo?: string
          telefono?: string
          talleres_realizados?: number
        }
        Relationships: []
      }
      asistencias: {
        Row: {
          fecha_clase: string
          id: string
          inscripcion_id: string
          presente: boolean | null
        }
        Insert: {
          fecha_clase: string
          id?: string
          inscripcion_id: string
          presente?: boolean | null
        }
        Update: {
          fecha_clase?: string
          id?: string
          inscripcion_id?: string
          presente?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "curso_inscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_comunicaciones_checklist: {
        Row: {
          completado: boolean | null
          curso_id: string
          fecha_completado: string | null
          id: string
          tipo_mensaje: string
        }
        Insert: {
          completado?: boolean | null
          curso_id: string
          fecha_completado?: string | null
          id?: string
          tipo_mensaje: string
        }
        Update: {
          completado?: boolean | null
          curso_id?: string
          fecha_completado?: string | null
          id?: string
          tipo_mensaje?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_comunicaciones_checklist_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_inscripciones: {
        Row: {
          alumno_id: string
          creado_en: string | null
          curso_id: string
          estado_pago: string
          id: string
          monto_pactado: number | null
        }
        Insert: {
          alumno_id: string
          creado_en?: string | null
          curso_id: string
          estado_pago?: string
          id?: string
          monto_pactado?: number | null
        }
        Update: {
          alumno_id?: string
          creado_en?: string | null
          curso_id?: string
          estado_pago?: string
          id?: string
          monto_pactado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curso_inscripciones_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_inscripciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          creado_en: string | null
          dias_cursado: string
          fecha_fin: string
          fecha_inicio: string
          horarios: string
          id: string
          nombre: string
          whatsapp_link: string
          clase_dates: string[] | null
          clases_completadas: boolean[] | null
        }
        Insert: {
          creado_en?: string | null
          dias_cursado: string
          fecha_fin: string
          fecha_inicio: string
          horarios: string
          id?: string
          nombre: string
          whatsapp_link: string
          clase_dates?: string[]
          clases_completadas?: boolean[]
        }
        Update: {
          creado_en?: string | null
          dias_cursado?: string
          fecha_fin?: string
          fecha_inicio?: string
          horarios?: string
          id?: string
          nombre?: string
          whatsapp_link?: string
          clase_dates?: string[]
          clases_completadas?: boolean[]
        }
        Relationships: []
      }
      movimientos_caja: {
        Row: {
          id: string
          tipo: string
          concepto: string
          monto: number
          alumno_id: string | null
          curso_id: string | null
          inscripcion_id: string | null
          pago_id: string | null
          fecha: string
          notas: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          tipo: string
          concepto: string
          monto: number
          alumno_id?: string | null
          curso_id?: string | null
          inscripcion_id?: string | null
          pago_id?: string | null
          fecha?: string
          notas?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          tipo?: string
          concepto?: string
          monto?: number
          alumno_id?: string | null
          curso_id?: string | null
          inscripcion_id?: string | null
          pago_id?: string | null
          fecha?: string
          notas?: string | null
          creado_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "curso_inscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      mensaje_plantillas: {
        Row: {
          id: string
          nombre: string
          categoria: string
          contenido: string
          activa: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          nombre: string
          categoria: string
          contenido: string
          activa?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          categoria?: string
          contenido?: string
          activa?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mensajes_enviados: {
        Row: {
          id: string
          alerta_id: string | null
          alumno_id: string | null
          curso_id: string | null
          plantilla_id: string | null
          contenido_enviado: string
          canal: string
          tipo_envio: string
          enviado_en: string | null
        }
        Insert: {
          id?: string
          alerta_id?: string | null
          alumno_id?: string | null
          curso_id?: string | null
          plantilla_id?: string | null
          contenido_enviado: string
          canal?: string
          tipo_envio: string
          enviado_en?: string | null
        }
        Update: {
          id?: string
          alerta_id?: string | null
          alumno_id?: string | null
          curso_id?: string | null
          plantilla_id?: string | null
          contenido_enviado?: string
          canal?: string
          tipo_envio?: string
          enviado_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_enviados_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_enviados_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_enviados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_enviados_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "mensaje_plantillas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          fecha_pago: string
          id: string
          inscripcion_id: string
          monto: number
          registrado_en: string | null
          tipo: string
          metodo_pago: string
          cuenta_destino: string | null
        }
        Insert: {
          fecha_pago: string
          id?: string
          inscripcion_id: string
          monto: number
          registrado_en?: string | null
          tipo: string
          metodo_pago?: string
          cuenta_destino?: string | null
        }
        Update: {
          fecha_pago?: string
          id?: string
          inscripcion_id?: string
          monto?: number
          registrado_en?: string | null
          tipo?: string
          metodo_pago?: string
          cuenta_destino?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "curso_inscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      talleres_practica: {
        Row: {
          id: string
          alumno_id: string
          fecha: string
          pagado: boolean
          asistio: boolean
          notas: string | null
          creado_en: string | null
          metodo_pago: string
          cuenta_destino: string | null
        }
        Insert: {
          id?: string
          alumno_id: string
          fecha?: string
          pagado?: boolean
          asistio?: boolean
          notas?: string | null
          creado_en?: string | null
          metodo_pago?: string
          cuenta_destino?: string | null
        }
        Update: {
          id?: string
          alumno_id?: string
          fecha?: string
          pagado?: boolean
          asistio?: boolean
          notas?: string | null
          creado_en?: string | null
          metodo_pago?: string
          cuenta_destino?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talleres_practica_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Curso = Database['public']['Tables']['cursos']['Row']
export type Alumno = Database['public']['Tables']['alumnos']['Row']
export type Inscripcion = Database['public']['Tables']['curso_inscripciones']['Row']
export type Asistencia = Database['public']['Tables']['asistencias']['Row']
export type Pago = Database['public']['Tables']['pagos']['Row']
export type Alerta = Database['public']['Tables']['alertas']['Row']
export type AlertaPlantillaDefecto = Database['public']['Tables']['alerta_plantillas_defecto']['Row']
export type ComunicacionChecklist = Database['public']['Tables']['curso_comunicaciones_checklist']['Row']
export type MensajePlantilla = Database['public']['Tables']['mensaje_plantillas']['Row']
export type MensajeEnviado = Database['public']['Tables']['mensajes_enviados']['Row']
export type TallerPractica = Database['public']['Tables']['talleres_practica']['Row']
export type MovimientoCaja = Database['public']['Tables']['movimientos_caja']['Row']

export type InscripcionConDetalles = Inscripcion & {
  alumnos: Alumno
  pagos: Pago[]
}

export type CursoConDetalles = Curso & {
  curso_inscripciones: InscripcionConDetalles[]
  curso_comunicaciones_checklist: ComunicacionChecklist[]
}
