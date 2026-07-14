import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const modulo = req.nextUrl.searchParams.get('modulo')
  if (!modulo) {
    return NextResponse.json({ error: 'Falta modulo' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('conexiones_curriculares')
    .select('*')
    .eq('modulo', modulo)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
