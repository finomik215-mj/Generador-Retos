import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptFicha, type Ficha } from '@/lib/systemPromptFicha'
import type { ObjetivoPlan, ArcoModul } from '@/lib/systemPromptPlanificacion'
import { supabase } from '@/lib/supabase'

const IDIOMA_NOMS: Record<string, string> = { ca: 'català', es: 'castellà', en: 'anglès' }

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, orden } = await req.json() as { modulo: string; orden: number }
  if (!modulo?.trim() || typeof orden !== 'number') {
    return NextResponse.json({ error: 'Falten modulo o orden' }, { status: 400 })
  }

  const [{ data: planRow }, { data: materialData }] = await Promise.all([
    supabase.from('planificacions').select('*').eq('modulo', modulo).maybeSingle(),
    supabase.from('materials_referencia').select('contingut').eq('modul', modulo).single(),
  ])

  if (!planRow) {
    return NextResponse.json({ error: 'No hi ha pla per a aquest mòdul' }, { status: 400 })
  }

  const arco = planRow.arco as ArcoModul
  const objetivos = (planRow.objetivos as ObjetivoPlan[]) ?? []
  const obj = objetivos.find(o => o.orden === orden)
  if (!obj) {
    return NextResponse.json({ error: `No existeix l'objectiu ${orden}` }, { status: 400 })
  }

  const idioma = (planRow.idioma as string) ?? 'ca'
  const anterior = objetivos.find(o => o.orden === orden - 1)
  const seguent = objetivos.find(o => o.orden === orden + 1)
  const material = materialData?.contingut ?? '(sense material de referència)'

  const userMessage = `ARC DEL MÒDUL:
- Model inicial: ${arco.modeloInicial}
- Model final: ${arco.modeloFinal}
- Capacitat: ${arco.capacidadDecision}

OBJECTIU D'AQUESTA PEÇA (#${obj.orden}, bloc "${obj.bloque}", subtema "${obj.subtema}"):
- Canvi: ${obj.objetivo}
- Diagnòstic: ${obj.diagnostico}
- Obstacle o llacuna: ${obj.obstaculoOLaguna}${obj.porQuePlausible ? `\n- Per què és plausible: ${obj.porQuePlausible}` : ''}
- Papel: ${obj.papel} · Profunditat: ${obj.profundidad} · ESTRATÈGIA (a executar): ${obj.estrategia}

CONTINUÏTAT:
- Es recolza en: ${anterior ? `#${anterior.orden} ${anterior.objetivo}` : '(primer objectiu del mòdul)'}
- Prepara: ${seguent ? `#${seguent.orden} ${seguent.objetivo}` : '(últim objectiu del mòdul)'}

MATERIAL DE REFERÈNCIA (única font de fets):
---
${material}
---

Dissenya la fitxa d'aquesta peça i respon NOMÉS amb el JSON de l'esquema.`

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: getSystemPromptFicha(IDIOMA_NOMS[idioma] ?? 'català'),
      messages: [{ role: 'user', content: userMessage }],
    })
    raw = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  } catch (err) {
    return NextResponse.json({ error: 'Error cridant el model', detail: String(err) }, { status: 502 })
  }

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end < 0) {
    return NextResponse.json({ error: 'El model no ha retornat JSON', raw: raw.slice(0, 400) }, { status: 502 })
  }

  let parsed: Omit<Ficha, 'modulo' | 'orden' | 'idioma' | 'objetivo'>
  try {
    parsed = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return NextResponse.json({ error: 'JSON invàlid', raw: raw.slice(-400) }, { status: 502 })
  }

  const ficha: Ficha = {
    modulo,
    orden,
    idioma,
    objetivo: obj.objetivo,
    partida: parsed.partida ?? '',
    colisionOAncla: parsed.colisionOAncla ?? '',
    recursoCentral: parsed.recursoCentral ?? '',
    ordenExplicacion: parsed.ordenExplicacion ?? [],
    incluidos: parsed.incluidos ?? [],
    excluidos: parsed.excluidos ?? [],
    evidenciaLogro: parsed.evidenciaLogro ?? '',
  }

  return NextResponse.json(ficha)
}
