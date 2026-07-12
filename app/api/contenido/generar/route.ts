import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptContenido, type ModulContext } from '@/lib/systemPromptContenido'
import { supabase } from '@/lib/supabase'

function derivarPes(blocNom: string, totalBlocs: number, blocIndex: number): ModulContext['pesBlocActual'] {
  const nom = blocNom.toLowerCase()
  if (blocIndex === 0) return 'lleuger'
  if (blocIndex >= totalBlocs - 1) return 'normal'
  if (/eina|product|invers|nòmina|impost|contrac|mercat|simulad/.test(nom)) return 'intens'
  if (/hàbit|consolidar|reflexi|construir|aprendr/.test(nom)) return 'lleuger'
  return 'normal'
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, leccion, subtema, pregunta_numero, pregunta_texto, palabras } = await req.json() as {
    modulo: string; leccion: string; subtema: string
    pregunta_numero: number; pregunta_texto: string; palabras?: number
  }

  if (!modulo?.trim() || !leccion?.trim() || !subtema?.trim() || !pregunta_texto?.trim()) {
    return NextResponse.json({ error: 'Falten camps obligatoris' }, { status: 400 })
  }

  const [{ data: allSubtemes }, { data: allLeccions }, { data: historialData }] = await Promise.all([
    supabase.from('subtemes').select('modulo, leccion, nom').eq('modulo', modulo),
    supabase.from('leccions').select('modulo, nom').eq('modulo', modulo).order('ordre', { ascending: true }),
    supabase.from('contenido_aprobado')
      .select('modulo, leccion, subtema, pregunta_numero, pregunta_texto, contenido')
      .eq('modulo', modulo)
      .order('created_at', { ascending: true }),
  ])

  const totalSubtemes = allSubtemes?.length ?? 0
  const totalBlocs = allLeccions?.length ?? 1
  const blocIndex = allLeccions?.findIndex(l => l.nom === leccion) ?? 0
  const subtemesBlocActual = allSubtemes?.filter(s => s.leccion === leccion).map(s => s.nom) ?? []
  const pes = derivarPes(leccion, totalBlocs, blocIndex)

  const modulContext: ModulContext = {
    nom: modulo,
    descripcio: `${totalBlocs} lliçons, ${totalSubtemes} subtemes en total`,
    totalSubtemes,
    blocActual: leccion,
    descripcioBloc: leccion,
    subtemesBlocActual,
    pesBlocActual: pes,
  }

  const historial = historialData?.map(row =>
    `[${row.leccion} > ${row.subtema} > Pregunta ${row.pregunta_numero}: ${row.pregunta_texto}]\n${row.contenido}`
  ).join('\n\n---\n\n') ?? ''

  const systemPrompt = getSystemPromptContenido(historial, modulContext, palabras)

  const userMessage = `Escriu el contingut educatiu per a aquest subtema i pregunta concreta.

Modul: ${modulo}
Llico / Bloc: ${leccion}
Subtema: ${subtema}
Pregunta que ha de respondre el contingut: ${pregunta_texto}

Analitza el tema, escull el format mes adequat i escriu el contingut. Text fluid en paragrafs, sense activitats ni exercicis (els reptes es generen per separat). Llest per inserir al curs.`

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

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
