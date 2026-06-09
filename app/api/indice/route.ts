import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function auth(req: NextRequest) {
  return req.cookies.get('session')?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const [modulsRes, leccionsRes, subtemesRes, preguntesRes] = await Promise.all([
    supabase.from('moduls').select('*').order('ordre', { ascending: true }),
    supabase.from('leccions').select('*').order('ordre', { ascending: true }),
    supabase.from('subtemes').select('*').order('ordre', { ascending: true }),
    supabase.from('preguntes').select('*').order('ordre', { ascending: true }),
  ])

  return NextResponse.json({
    moduls: modulsRes.data ?? [],
    leccions: leccionsRes.data ?? [],
    subtemes: subtemesRes.data ?? [],
    preguntes: preguntesRes.data ?? [],
  })
}

// Legacy POST — kept for backward compatibility with old curl scripts
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const body = await req.json() as {
    modulo: string; leccion: string; subtema: string
    pregunta_1?: string; pregunta_2?: string; pregunta_3?: string
  }
  const { modulo, leccion, subtema, pregunta_1, pregunta_2, pregunta_3 } = body
  if (!modulo?.trim() || !leccion?.trim() || !subtema?.trim()) {
    return NextResponse.json({ error: 'Falten camps obligatoris' }, { status: 400 })
  }

  // Ensure modul exists
  await supabase.from('moduls').upsert({ nom: modulo.trim(), ordre: 0 }, { onConflict: 'nom', ignoreDuplicates: true })
  // Ensure leccion exists
  await supabase.from('leccions').upsert({ modulo: modulo.trim(), nom: leccion.trim(), ordre: 0 }, { onConflict: 'modulo,nom', ignoreDuplicates: true })
  // Ensure subtema exists
  const { data, error } = await supabase
    .from('subtemes')
    .upsert({ modulo: modulo.trim(), leccion: leccion.trim(), nom: subtema.trim(), ordre: 0 }, { onConflict: 'modulo,leccion,nom', ignoreDuplicates: true })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert preguntes
  const preguntes = [pregunta_1, pregunta_2, pregunta_3].filter(Boolean) as string[]
  for (let i = 0; i < preguntes.length; i++) {
    await supabase.from('preguntes').insert({
      modulo: modulo.trim(), leccion: leccion.trim(), subtema: subtema.trim(),
      text: preguntes[i].trim(), ordre: i + 1,
    })
  }

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const body = await req.json() as
    | { tipo: 'subtema'; id: string }
    | { tipo: 'leccion'; modulo: string; leccion: string }
    | { tipo: 'modulo'; modulo: string }

  const tipo = body.tipo

  if (tipo === 'subtema') {
    const { id } = body as { tipo: 'subtema'; id: string }
    const { data: item } = await supabase.from('subtemes').select('*').eq('id', id).single()
    if (item) {
      await supabase.from('contenido_aprobado').delete().eq('modulo', item.modulo).eq('leccion', item.leccion).eq('subtema', item.nom)
      await supabase.from('retos_guardados').delete().eq('modulo', item.modulo).eq('leccion', item.leccion).eq('subtema', item.nom)
      await supabase.from('preguntes').delete().eq('modulo', item.modulo).eq('leccion', item.leccion).eq('subtema', item.nom)
    }
    await supabase.from('subtemes').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (tipo === 'leccion') {
    const { modulo, leccion } = body as { tipo: 'leccion'; modulo: string; leccion: string }
    await supabase.from('contenido_aprobado').delete().eq('modulo', modulo).eq('leccion', leccion)
    await supabase.from('retos_guardados').delete().eq('modulo', modulo).eq('leccion', leccion)
    await supabase.from('preguntes').delete().eq('modulo', modulo).eq('leccion', leccion)
    await supabase.from('subtemes').delete().eq('modulo', modulo).eq('leccion', leccion)
    const { data: lec } = await supabase.from('leccions').select('id').eq('modulo', modulo).eq('nom', leccion).single()
    if (lec) await supabase.from('leccions').delete().eq('id', lec.id)
    return NextResponse.json({ ok: true })
  }

  if (tipo === 'modulo') {
    const { modulo } = body as { tipo: 'modulo'; modulo: string }
    await supabase.from('contenido_aprobado').delete().eq('modulo', modulo)
    await supabase.from('retos_guardados').delete().eq('modulo', modulo)
    await supabase.from('preguntes').delete().eq('modulo', modulo)
    await supabase.from('subtemes').delete().eq('modulo', modulo)
    await supabase.from('leccions').delete().eq('modulo', modulo)
    const { data: mod } = await supabase.from('moduls').select('id').eq('nom', modulo).single()
    if (mod) await supabase.from('moduls').delete().eq('id', mod.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Tipus no reconegut' }, { status: 400 })
}
