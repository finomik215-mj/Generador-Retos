import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const modulo = searchParams.get('modulo')
  const leccion = searchParams.get('leccion')
  const subtema = searchParams.get('subtema')
  const pregunta_numero = searchParams.get('pregunta_numero')

  if (!modulo || !leccion || !subtema || !pregunta_numero) return NextResponse.json({ data: null })

  const { data } = await supabase
    .from('contenido_aprobado')
    .select('*')
    .eq('modulo', modulo)
    .eq('leccion', leccion)
    .eq('subtema', subtema)
    .eq('pregunta_numero', Number(pregunta_numero))
    .single()

  return NextResponse.json({ data: data ?? null })
}
