import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { MapaConceptos } from '@/lib/systemPromptMapaConceptos'

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { mapa, estado = 'propuesto' } = await req.json() as {
    mapa: MapaConceptos; estado?: 'propuesto' | 'aprobado'
  }

  if (!mapa || !Array.isArray(mapa.conceptos)) {
    return NextResponse.json({ error: 'Falta el mapa' }, { status: 400 })
  }

  const { error } = await supabase.from('mapa_conceptos').upsert({
    id: 'curso',
    conceptos: mapa.conceptos,
    estado,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, estado })
}
