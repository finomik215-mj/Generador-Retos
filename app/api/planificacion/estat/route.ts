import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const modulo = req.nextUrl.searchParams.get('modulo')

  // Sense mòdul: estat del pla de tots els mòduls (per marcar el desplegable).
  if (!modulo) {
    const { data } = await supabase.from('planificacions').select('modulo, estado')
    return NextResponse.json({ plans: data ?? [] })
  }

  // Amb mòdul: estat detallat de fitxes, continguts i reptes.
  const [{ data: planRow }, { data: fichas }, { data: continguts }, { data: reptes }] = await Promise.all([
    supabase.from('planificacions').select('estado').eq('modulo', modulo).maybeSingle(),
    supabase.from('fichas').select('orden, estado').eq('modulo', modulo),
    supabase.from('contenido_aprobado').select('leccion, subtema, idioma').eq('modulo', modulo),
    supabase.from('retos_guardados').select('leccion, subtema').eq('modulo', modulo),
  ])

  return NextResponse.json({
    plan: planRow?.estado ?? null,
    fichas: fichas ?? [],
    continguts: continguts ?? [],
    reptes: reptes ?? [],
  })
}
