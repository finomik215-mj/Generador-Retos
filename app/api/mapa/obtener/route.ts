import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('mapa_conceptos')
    .select('*')
    .eq('id', 'curso')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
