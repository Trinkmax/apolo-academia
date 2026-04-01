import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tucxkgscnrahclaeudgs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y3hrZ3NjbnJhaGNsYWV1ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODY3NTcsImV4cCI6MjA2NzY2Mjc1N30.yHdUB407k-T9Bbw6VHMgXGM-tSljpG-PHWNA7AZkKpg'
)

async function test() {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      *,
      curso_comunicaciones_checklist(*),
      curso_inscripciones(count)
    `)
    .order('fecha_inicio', { ascending: true })
  
  if (error) {
    console.error('ERROR:', JSON.stringify(error, null, 2))
  } else {
    console.log('SUCCESS:', data)
  }
}

test()
