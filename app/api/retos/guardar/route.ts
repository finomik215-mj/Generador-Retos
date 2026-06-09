import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, leccion, subtema, pregunta_numero, pregunta_texto, tipo_reto, datos, aprobado } = await req.json() as {
    modulo: string
    leccion: string
    subtema: string
    pregunta_numero: number
    pregunta_texto: string
    tipo_reto: string
    datos: Record<string, unknown>
    aprobado?: boolean
  }

  if (!modulo || !leccion || !subtema || pregunta_numero == null || !pregunta_texto || !tipo_reto || !datos) {
    return NextResponse.json({ error: 'Falten camps' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('retos_guardados')
    .insert({ modulo, leccion, subtema, pregunta_numero, pregunta_texto, tipo_reto, datos, aprobado: aprobado ?? false })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
