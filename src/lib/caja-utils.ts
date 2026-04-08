import { SupabaseClient } from '@supabase/supabase-js'

export async function registrarMovimientoCaja(
  supabase: SupabaseClient,
  params: {
    tipo: 'INGRESO' | 'EGRESO'
    concepto: string
    monto: number
    alumno_id?: string | null
    curso_id?: string | null
    inscripcion_id?: string | null
    pago_id?: string | null
    metodo_pago?: string
  }
) {
  const { data: sesionAbierta } = await supabase
    .from('sesiones_caja')
    .select('id')
    .eq('estado', 'ABIERTA')
    .maybeSingle()

  await supabase.from('movimientos_caja').insert([{
    tipo: params.tipo,
    concepto: params.concepto,
    monto: params.monto,
    alumno_id: params.alumno_id || null,
    curso_id: params.curso_id || null,
    inscripcion_id: params.inscripcion_id || null,
    pago_id: params.pago_id || null,
    sesion_caja_id: sesionAbierta?.id || null,
    metodo_pago: params.metodo_pago || 'efectivo',
  }])
}
