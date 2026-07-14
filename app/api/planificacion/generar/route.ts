import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptPlanificacion, type PlanModul } from '@/lib/systemPromptPlanificacion'
import { supabase } from '@/lib/supabase'
import { getMaterialReferencia } from '@/lib/materialReferencia'

const IDIOMA_NOMS: Record<string, string> = { ca: 'català', es: 'castellà', en: 'anglès' }

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const {
    modulo,
    horasTotales = 24,
    reservaRetosPct = 40,
    idioma = 'ca',
  } = await req.json() as {
    modulo: string; horasTotales?: number; reservaRetosPct?: number; idioma?: string
  }

  if (!modulo?.trim()) {
    return NextResponse.json({ error: 'Falta el mòdul' }, { status: 400 })
  }

  const [{ data: leccionsRaw }, { data: subtemesRaw }, materialRaw] = await Promise.all([
    supabase.from('leccions').select('nom, ordre').eq('modulo', modulo).order('ordre', { ascending: true }),
    supabase.from('subtemes').select('leccion, nom').eq('modulo', modulo),
    getMaterialReferencia(modulo),
  ])

  const leccions = leccionsRaw ?? []
  const subtemes = subtemesRaw ?? []
  if (leccions.length === 0) {
    return NextResponse.json({ error: 'El mòdul no té estructura (blocs) a Supabase' }, { status: 400 })
  }

  // Estructura del mòdul en text
  const estructura = leccions.map(l => {
    const subs = subtemes.filter(s => s.leccion === l.nom).map(s => `    - ${s.nom}`).join('\n')
    return `[${l.nom}]\n${subs}`
  }).join('\n\n')

  const minutosContenido = Math.round(horasTotales * 60 * (1 - reservaRetosPct / 100))
  const material = materialRaw ?? '(sense material de referència; no donis xifres concretes)'

  const userMessage = `MÒDUL: ${modulo}

PRESSUPOST DE TEMPS:
- Hores totals del mòdul: ${horasTotales}
- Reserva per a reptes: ${reservaRetosPct}%
- Temps disponible per a CONTINGUT: ${minutosContenido} minuts (la suma de minuts dels objectius ha d'ajustar-s'hi)

ESTRUCTURA DEL MÒDUL (blocs i subtemes, ja decidits; assigna cada objectiu a un d'aquests):
${estructura}

MATERIAL DE REFERÈNCIA (única font de fets i dades):
---
${material}
---

Dissenya el pla del mòdul i respon NOMÉS amb el JSON de l'esquema.`

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: getSystemPromptPlanificacion(IDIOMA_NOMS[idioma] ?? 'català'),
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

  let parsed: Omit<PlanModul, 'modulo' | 'idioma' | 'tiempo'>
  try {
    parsed = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return NextResponse.json({ error: 'JSON invàlid (potser truncat)', raw: raw.slice(-500) }, { status: 502 })
  }

  const plan: PlanModul = {
    modulo,
    idioma,
    arco: parsed.arco,
    tiempo: { horasTotales, reservaRetosPct, minutosContenido },
    objetivos: parsed.objetivos ?? [],
    recomendacionesEstructura: parsed.recomendacionesEstructura ?? [],
  }

  return NextResponse.json(plan)
}
