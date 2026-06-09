import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function auth(req: NextRequest) {
  return req.cookies.get('session')?.value === 'authenticated'
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  const { nom, ordre } = await req.json()
  if (!nom?.trim()) return NextResponse.json({ error: 'Nom obligatori' }, { status: 400 })
  const { data, error } = await supabase
    .from('moduls')
    .insert({ nom: nom.trim(), ordre: ordre ?? 0 })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  const { id, ordre } = await req.json()
  const { error } = await supabase.from('moduls').update({ ordre }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  const { id, nom } = await req.json()
  if (!nom) return NextResponse.json({ error: 'Nom obligatori' }, { status: 400 })
  // Cascade delete
  await supabase.from('contenido_aprobado').delete().eq('modulo', nom)
  await supabase.from('retos_guardados').delete().eq('modulo', nom)
  await supabase.from('preguntes').delete().eq('modulo', nom)
  await supabase.from('subtemes').delete().eq('modulo', nom)
  await supabase.from('leccions').delete().eq('modulo', nom)
  await supabase.from('moduls').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
