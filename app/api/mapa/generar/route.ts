import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptMapaConceptos, type MapaConceptos } from '@/lib/systemPromptMapaConceptos'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

const MODULO_EXCLUIDO = 'Módulo General'

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const [{ data: modulsRaw }, { data: leccionsRaw }, { data: subtemesRaw }] = await Promise.all([
    supabase.from('moduls').select('nom, ordre'),
    supabase.from('leccions').select('modulo, nom, ordre'),
    supabase.from('subtemes').select('modulo, leccion, nom, ordre'),
  ])

  const moduls = (modulsRaw ?? []).filter(m => m.nom !== MODULO_EXCLUIDO)
  const modOrder: Record<string, number> = {}
  for (const m of moduls) modOrder[m.nom] = m.ordre ?? 999
  const leccions = (leccionsRaw ?? []).filter(l => l.modulo !== MODULO_EXCLUIDO)
  const subtemes = (subtemesRaw ?? []).filter(s => s.modulo !== MODULO_EXCLUIDO)

  if (subtemes.length === 0) {
    return NextResponse.json({ error: 'No hi ha subtemes per mapejar' }, { status: 400 })
  }

  const leccioOrder: Record<string, number> = {}
  for (const l of leccions) leccioOrder[`${l.modulo}|${l.nom}`] = l.ordre ?? 999

  // Ordre global de curs: mòdul → bloc → subtema
  const ordenados = [...subtemes].sort((a, b) => {
    const mo = (modOrder[a.modulo] ?? 999) - (modOrder[b.modulo] ?? 999)
    if (mo !== 0) return mo
    const lo = (leccioOrder[`${a.modulo}|${a.leccion}`] ?? 999) - (leccioOrder[`${b.modulo}|${b.leccion}`] ?? 999)
    if (lo !== 0) return lo
    return (a.ordre ?? 999) - (b.ordre ?? 999)
  })

  const lista = ordenados
    .map((s, i) => `${i + 1}. [${s.modulo}] > [${s.leccion}] > ${s.nom}`)
    .join('\n')

  const userMessage = `PIEZAS DEL CURSO EN ORDEN (el número marca el orden real del curso; el dueño de un concepto es siempre su aparición más temprana):

${lista}

Reparte los conceptos recurrentes y responde SOLO con el JSON del esquema.`

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: getSystemPromptMapaConceptos(),
      messages: [{ role: 'user', content: userMessage }],
    })
    raw = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  } catch (err) {
    return NextResponse.json({ error: 'Error cridant el model', detail: String(err) }, { status: 502 })
  }

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end < 0) {
    return NextResponse.json({ error: 'El model no ha retornat JSON', raw: raw.slice(0, 500) }, { status: 502 })
  }

  let parsed: MapaConceptos
  try {
    parsed = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return NextResponse.json({ error: 'JSON invàlid (potser truncat)', raw: raw.slice(-500) }, { status: 502 })
  }

  return NextResponse.json({ conceptos: parsed.conceptos ?? [] } as MapaConceptos)
}
