import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, leccion, subtema, contenido } = await req.json() as {
    modulo: string
    leccion: string
    subtema: string
    contenido: string
  }

  if (!modulo || !leccion || !subtema || !contenido) {
    return NextResponse.json({ error: 'Falten camps' }, { status: 400 })
  }

  const palabras = contenido.trim().split(/\s+/).length

  const { error } = await supabase
    .from('contenido_aprobado')
    .upsert(
      { modulo, leccion, subtema, contenido, palabras },
      { onConflict: 'modulo,leccion,subtema' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, palabras })
}
