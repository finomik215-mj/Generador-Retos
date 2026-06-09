import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptContenido } from '@/lib/systemPromptContenido'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, leccion, subtema, pregunta_numero, pregunta_texto, palabras } = await req.json() as {
    modulo: string
    leccion: string
    subtema: string
    pregunta_numero: number
    pregunta_texto: string
    palabras: number
  }

  if (!modulo?.trim() || !leccion?.trim() || !subtema?.trim() || !pregunta_texto?.trim()) {
    return NextResponse.json({ error: 'Falten camps obligatoris' }, { status: 400 })
  }

  // Fetch historial del mismo módulo para dar contexto
  const { data: historialData } = await supabase
    .from('contenido_aprobado')
    .select('modulo, leccion, subtema, pregunta_numero, pregunta_texto, contenido')
    .eq('modulo', modulo)
    .order('created_at', { ascending: true })

  const historial = historialData?.map(row =>
    `[${row.modulo} > ${row.leccion} > ${row.subtema} > Pregunta ${row.pregunta_numero}: ${row.pregunta_texto}]\n${row.contenido}`
  ).join('\n\n---\n\n') ?? ''

  const systemPrompt = getSystemPromptContenido(historial)

  const userMessage = `Escriu el contingut educatiu per a aquesta pregunta específica.

Mòdul: ${modulo}
Lliçó: ${leccion}
Subtema: ${subtema}
Objectiu de paraules: ${palabras ?? 250}

Pregunta que ha de respondre el contingut:
${pregunta_texto}

Recorda: text fluid en paràgrafs, sense títols, sense llistes, sense activitats. Llest per inserir al curs.`

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
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
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
