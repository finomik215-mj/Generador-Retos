import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptReptes, type Repte } from '@/lib/systemPromptReptes'
import type { Ficha } from '@/lib/systemPromptFicha'
import type { ObjetivoPlan } from '@/lib/systemPromptPlanificacion'
import { supabase } from '@/lib/supabase'

const IDIOMA_NOMS: Record<string, string> = { ca: 'català', es: 'castellà', en: 'anglès' }

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, orden, idioma = 'ca' } = await req.json() as { modulo: string; orden: number; idioma?: string }
  if (!modulo?.trim() || typeof orden !== 'number') {
    return NextResponse.json({ error: 'Falten modulo o orden' }, { status: 400 })
  }

  const [{ data: fichaRow }, { data: planRow }] = await Promise.all([
    supabase.from('fichas').select('*').eq('modulo', modulo).eq('orden', orden).maybeSingle(),
    supabase.from('planificacions').select('objetivos').eq('modulo', modulo).maybeSingle(),
  ])

  if (!fichaRow) {
    return NextResponse.json({ error: 'Aquest objectiu no té fitxa. Genera-la primer.' }, { status: 400 })
  }

  const objetivos = (planRow?.objetivos as ObjetivoPlan[]) ?? []
  const obj = objetivos.find(o => o.orden === orden)
  if (!obj) {
    return NextResponse.json({ error: 'No es troba l\'objectiu al pla' }, { status: 400 })
  }

  const { data: contRow } = await supabase
    .from('contenido_aprobado')
    .select('contenido')
    .eq('modulo', modulo).eq('leccion', obj.bloque).eq('subtema', obj.subtema).eq('idioma', idioma)
    .maybeSingle()

  if (!contRow?.contenido) {
    return NextResponse.json({ error: 'Aquest objectiu no té contingut aprovat en aquest idioma. Genera i desa el contingut primer.' }, { status: 400 })
  }

  const ficha: Ficha = {
    modulo, orden, idioma,
    objetivo: (fichaRow.objetivo as string) ?? '',
    partida: (fichaRow.partida as string) ?? '',
    colisionOAncla: (fichaRow.colision_o_ancla as string) ?? '',
    recursoCentral: (fichaRow.recurso_central as string) ?? '',
    ordenExplicacion: (fichaRow.orden_explicacion as string[]) ?? [],
    incluidos: (fichaRow.incluidos as string[]) ?? [],
    excluidos: (fichaRow.excluidos as string[]) ?? [],
    evidenciaLogro: (fichaRow.evidencia_logro as string) ?? '',
  }

  const userMessage = `OBJECTIU: ${ficha.objetivo}
Diagnòstic: ${obj.diagnostico} · Obstacle o llacuna: ${obj.obstaculoOLaguna} · Estratègia: ${obj.estrategia}

EVIDÈNCIA DE LOGRO (criteri fix del que cal demostrar):
${ficha.evidenciaLogro}

CONTINGUT JA APROVAT (l'alumne ja l'ha après; no el reensenyis):
---
${contRow.contenido}
---

Dissenya els reptes i respon NOMÉS amb l'array JSON.`

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  let raw = ''
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      system: getSystemPromptReptes(IDIOMA_NOMS[idioma] ?? 'català'),
      messages: [{ role: 'user', content: userMessage }],
    })
    raw = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  } catch (err) {
    return NextResponse.json({ error: 'Error cridant el model', detail: String(err) }, { status: 502 })
  }

  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start < 0 || end < 0) {
    return NextResponse.json({ error: 'El model no ha retornat JSON', raw: raw.slice(0, 400) }, { status: 502 })
  }

  let reptes: Repte[]
  try {
    reptes = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return NextResponse.json({ error: 'JSON invàlid', raw: raw.slice(-400) }, { status: 502 })
  }

  return NextResponse.json({ reptes })
}
