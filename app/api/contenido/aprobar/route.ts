import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, leccion, subtema, pregunta_numero, pregunta_texto, contenido } = await req.json() as {
    modulo: string
    leccion: string
    subtema: string
    pregunta_numero: number
    pregunta_texto: string
    contenido: string
  }

  if (!modulo || !leccion || !subtema || !pregunta_texto || !contenido || pregunta_numero == null) {
    return NextResponse.json({ error: 'Falten camps' }, { status: 400 })
  }

  const palabras = contenido.trim().split(/\s+/).length

  const { error } = await supabase
    .from('contenido_aprobado')
    .upsert(
      { modulo, leccion, subtema, pregunta_numero, pregunta_texto, contenido, palabras },
      { onConflict: 'modulo,leccion,subtema,pregunta_numero' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, palabras })
}
