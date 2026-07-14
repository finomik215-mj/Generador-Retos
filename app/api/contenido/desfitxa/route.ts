import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptContenido, type Idioma } from '@/lib/systemPromptContenido'
import type { Ficha } from '@/lib/systemPromptFicha'
import type { ObjetivoPlan } from '@/lib/systemPromptPlanificacion'
import { supabase } from '@/lib/supabase'
import { getMaterialReferencia } from '@/lib/materialReferencia'

const IDIOMA_LABELS: Record<string, string> = { ca: 'català', es: 'castellà', en: 'anglès' }
const PARAULES_PER_PROFUNDITAT: Record<string, number> = { reconocer: 450, comprender: 700, aplicar: 900 }

function rowToFicha(row: Record<string, unknown>): Ficha {
  return {
    modulo: row.modulo as string,
    orden: row.orden as number,
    idioma: (row.idioma as string) ?? 'ca',
    objetivo: (row.objetivo as string) ?? '',
    partida: (row.partida as string) ?? '',
    colisionOAncla: (row.colision_o_ancla as string) ?? '',
    recursoCentral: (row.recurso_central as string) ?? '',
    ordenExplicacion: (row.orden_explicacion as string[]) ?? [],
    incluidos: (row.incluidos as string[]) ?? [],
    excluidos: (row.excluidos as string[]) ?? [],
    evidenciaLogro: (row.evidencia_logro as string) ?? '',
  }
}

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, orden, idioma = 'ca' } = await req.json() as {
    modulo: string; orden: number; idioma?: Idioma
  }
  if (!modulo?.trim() || typeof orden !== 'number') {
    return NextResponse.json({ error: 'Falten modulo o orden' }, { status: 400 })
  }

  const [{ data: fichaRow }, { data: planRow }, materialRaw, { data: historialData }, { data: subtemesRaw }, { data: leccionsRaw }] = await Promise.all([
    supabase.from('fichas').select('*').eq('modulo', modulo).eq('orden', orden).maybeSingle(),
    supabase.from('planificacions').select('objetivos').eq('modulo', modulo).maybeSingle(),
    getMaterialReferencia(modulo),
    supabase.from('contenido_aprobado').select('leccion, subtema, contenido').eq('modulo', modulo).eq('idioma', idioma).order('created_at', { ascending: true }),
    supabase.from('subtemes').select('modulo, leccion, nom'),
    supabase.from('leccions').select('modulo, nom, ordre').order('modulo', { ascending: true }).order('ordre', { ascending: true }),
  ])

  if (!fichaRow) {
    return NextResponse.json({ error: 'Aquest objectiu encara no té fitxa. Genera i aprova la fitxa primer.' }, { status: 400 })
  }

  const ficha = rowToFicha(fichaRow)
  const objetivos = (planRow?.objetivos as ObjetivoPlan[]) ?? []
  const obj = objetivos.find(o => o.orden === orden)
  const palabras = PARAULES_PER_PROFUNDITAT[obj?.profundidad ?? 'comprender'] ?? 700

  // Índex complet del curs
  const subtemes = subtemesRaw ?? []
  const byModule = new Map<string, string[]>()
  for (const l of leccionsRaw ?? []) {
    if (!byModule.has(l.modulo)) byModule.set(l.modulo, [])
    byModule.get(l.modulo)!.push(l.nom)
  }
  let indexCurriculum = ''
  for (const [mod, blocs] of byModule) {
    indexCurriculum += `\n### ${mod}\n`
    for (const bloc of blocs) {
      const subs = subtemes.filter(s => s.modulo === mod && s.leccion === bloc).map(s => s.nom)
      indexCurriculum += `  [${bloc}]\n    ${subs.join(' · ')}\n`
    }
  }

  const historial = historialData?.map(row => `[${row.leccion} > ${row.subtema}]\n${row.contenido}`).join('\n\n---\n\n') ?? ''
  const material = materialRaw ?? undefined

  const systemPrompt = getSystemPromptContenido(historial, undefined, palabras, idioma, material, indexCurriculum, ficha)

  const idiomaLabel = IDIOMA_LABELS[idioma] ?? idioma
  const userMessage = `Escriu el contingut educatiu d'aquesta peça en ${idiomaLabel}, executant la fitxa que tens al prompt.

Objectiu de la peça: ${ficha.objetivo}

Text fluid en paràgrafs, sense activitats ni exercicis. Llest per inserir al curs.`

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
