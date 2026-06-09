import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const modulo = searchParams.get('modulo')
  const leccion = searchParams.get('leccion')
  const subtema = searchParams.get('subtema')
  const pregunta_numero = searchParams.get('pregunta_numero')

  let query = supabase.from('retos_guardados').select('*').order('created_at', { ascending: true })

  if (modulo) query = query.eq('modulo', modulo)
  if (leccion) query = query.eq('leccion', leccion)
  if (subtema) query = query.eq('subtema', subtema)
  if (pregunta_numero) query = query.eq('pregunta_numero', Number(pregunta_numero))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
