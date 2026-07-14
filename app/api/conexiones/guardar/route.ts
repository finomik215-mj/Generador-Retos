import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { GuiaConexiones } from '@/lib/systemPromptConexiones'

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { guia, estado = 'propuesto' } = await req.json() as {
    guia: GuiaConexiones; estado?: 'propuesto' | 'aprobado'
  }

  if (!guia?.modulo || !Array.isArray(guia.bloques)) {
    return NextResponse.json({ error: 'Falta la guia' }, { status: 400 })
  }

  const { error } = await supabase.from('conexiones_curriculares').upsert({
    modulo: guia.modulo,
    intro: guia.intro ?? '',
    bloques: guia.bloques,
    estado,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'modulo' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, estado })
}
