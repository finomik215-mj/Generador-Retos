import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function auth(req: NextRequest) {
  return req.cookies.get('session')?.value === 'authenticated'
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  const { modulo, leccion, subtema, text, ordre } = await req.json()
  if (!modulo?.trim() || !leccion?.trim() || !subtema?.trim() || !text?.trim()) {
    return NextResponse.json({ error: 'Camps obligatoris' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('preguntes')
    .insert({ modulo: modulo.trim(), leccion: leccion.trim(), subtema: subtema.trim(), text: text.trim(), ordre: ordre ?? 1 })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  const { id, ordre } = await req.json()
  const { error } = await supabase.from('preguntes').update({ ordre }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  const { id } = await req.json()
  await supabase.from('preguntes').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
