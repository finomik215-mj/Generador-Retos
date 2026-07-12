import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const modul = new URL(req.url).searchParams.get('modul')
  if (!modul) return NextResponse.json({ data: null })

  const { data } = await supabase
    .from('materials_referencia')
    .select('contingut')
    .eq('modul', modul)
    .single()

  return NextResponse.json({ contingut: data?.contingut ?? '' })
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { modul, contingut } = await req.json() as { modul: string; contingut: string }
  if (!modul) return NextResponse.json({ error: 'Falta el mòdul' }, { status: 400 })

  const { error } = await supabase
    .from('materials_referencia')
    .upsert({ modul, contingut, updated_at: new Date().toISOString() }, { onConflict: 'modul' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
