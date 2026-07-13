import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const modulo = req.nextUrl.searchParams.get('modulo')
  const orden = req.nextUrl.searchParams.get('orden')
  if (!modulo || orden === null) {
    return NextResponse.json({ error: 'Falten modulo o orden' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .eq('modulo', modulo)
    .eq('orden', Number(orden))
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
