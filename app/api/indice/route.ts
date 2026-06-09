import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('curso_estructura')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const body = await req.json() as {
    modulo: string
    leccion: string
    subtema: string
    pregunta_1?: string
    pregunta_2?: string
    pregunta_3?: string
  }

  const { modulo, leccion, subtema, pregunta_1, pregunta_2, pregunta_3 } = body

  if (!modulo?.trim() || !leccion?.trim() || !subtema?.trim()) {
    return NextResponse.json({ error: 'Falten camps obligatoris' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('curso_estructura')
    .insert({ modulo, leccion, subtema, pregunta_1, pregunta_2, pregunta_3 })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const body = await req.json() as
    | { tipo: 'subtema'; id: string }
    | { tipo: 'leccion'; modulo: string; leccion: string }
    | { tipo: 'modulo'; modulo: string }
    | { id: string } // legacy — treat as subtema

  // Legacy single-id delete
  if ('id' in body && !('tipo' in body)) {
    const { error } = await supabase.from('curso_estructura').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const tipo = (body as { tipo: string }).tipo

  if (tipo === 'subtema') {
    const { id } = body as { tipo: 'subtema'; id: string }
    // Get subtema info first to cascade-delete contenido and retos
    const { data: item } = await supabase.from('curso_estructura').select('*').eq('id', id).single()
    if (item) {
      await supabase.from('contenido_aprobado').delete().eq('modulo', item.modulo).eq('leccion', item.leccion).eq('subtema', item.subtema)
      await supabase.from('retos_guardados').delete().eq('modulo', item.modulo).eq('leccion', item.leccion).eq('subtema', item.subtema)
    }
    const { error } = await supabase.from('curso_estructura').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (tipo === 'leccion') {
    const { modulo, leccion } = body as { tipo: 'leccion'; modulo: string; leccion: string }
    await supabase.from('contenido_aprobado').delete().eq('modulo', modulo).eq('leccion', leccion)
    await supabase.from('retos_guardados').delete().eq('modulo', modulo).eq('leccion', leccion)
    const { error } = await supabase.from('curso_estructura').delete().eq('modulo', modulo).eq('leccion', leccion)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (tipo === 'modulo') {
    const { modulo } = body as { tipo: 'modulo'; modulo: string }
    await supabase.from('contenido_aprobado').delete().eq('modulo', modulo)
    await supabase.from('retos_guardados').delete().eq('modulo', modulo)
    const { error } = await supabase.from('curso_estructura').delete().eq('modulo', modulo)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Tipus d\'eliminació no reconegut' }, { status: 400 })
}
