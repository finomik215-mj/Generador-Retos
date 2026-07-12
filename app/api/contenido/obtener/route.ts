import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const modulo = searchParams.get('modulo')
  const leccion = searchParams.get('leccion')
  const subtema = searchParams.get('subtema')
  const idioma = searchParams.get('idioma') ?? 'ca'

  if (!modulo || !leccion || !subtema) return NextResponse.json({ data: null })

  const { data } = await supabase
    .from('contenido_aprobado')
    .select('*')
    .eq('modulo', modulo)
    .eq('leccion', leccion)
    .eq('subtema', subtema)
    .eq('idioma', idioma)
    .single()

  return NextResponse.json({ data: data ?? null })
}
