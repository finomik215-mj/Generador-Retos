import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Ficha } from '@/lib/systemPromptFicha'

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { ficha, estado = 'propuesto' } = await req.json() as {
    ficha: Ficha; estado?: 'propuesto' | 'aprobado'
  }

  if (!ficha?.modulo || typeof ficha.orden !== 'number') {
    return NextResponse.json({ error: 'Falta la fitxa' }, { status: 400 })
  }

  const { error } = await supabase.from('fichas').upsert({
    modulo: ficha.modulo,
    orden: ficha.orden,
    idioma: ficha.idioma ?? 'ca',
    objetivo: ficha.objetivo,
    partida: ficha.partida,
    colision_o_ancla: ficha.colisionOAncla,
    recurso_central: ficha.recursoCentral,
    orden_explicacion: ficha.ordenExplicacion ?? [],
    incluidos: ficha.incluidos ?? [],
    excluidos: ficha.excluidos ?? [],
    evidencia_logro: ficha.evidenciaLogro,
    estado,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'modulo,orden' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, estado })
}
