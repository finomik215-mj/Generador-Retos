import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptContenido, type ModulContext, type Idioma } from '@/lib/systemPromptContenido'
import { supabase } from '@/lib/supabase'

function derivarPes(blocNom: string, totalBlocs: number, blocIndex: number): ModulContext['pesBlocActual'] {
  const nom = blocNom.toLowerCase()
  if (blocIndex === 0) return 'lleuger'
  if (blocIndex >= totalBlocs - 1) return 'normal'
  if (/eina|product|invers|nòmina|impost|contrac|mercat|simulad/.test(nom)) return 'intens'
  if (/hàbit|consolidar|reflexi|construir|aprendr/.test(nom)) return 'lleuger'
  return 'normal'
}

const IDIOMA_LABELS: Record<Idioma, string> = {
  ca: 'català',
  es: 'castellà',
  en: 'anglès',
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo, leccion, subtema, palabras, idioma = 'ca' } = await req.json() as {
    modulo: string; leccion: string; subtema: string; palabras?: number; idioma?: Idioma
  }

  if (!modulo?.trim() || !leccion?.trim() || !subtema?.trim()) {
    return NextResponse.json({ error: 'Falten camps obligatoris' }, { status: 400 })
  }

  const [
    { data: allSubtemes },
    { data: allLeccions },
    { data: historialData },
    { data: materialData },
  ] = await Promise.all([
    supabase.from('subtemes').select('modulo, leccion, nom').eq('modulo', modulo),
    supabase.from('leccions').select('modulo, nom').eq('modulo', modulo).order('ordre', { ascending: true }),
    supabase.from('contenido_aprobado')
      .select('leccion, subtema, contenido')
      .eq('modulo', modulo)
      .eq('idioma', idioma)
      .order('created_at', { ascending: true }),
    supabase.from('materials_referencia').select('contingut').eq('modul', modulo).single(),
  ])

  const totalSubtemes = allSubtemes?.length ?? 0
  const totalBlocs = allLeccions?.length ?? 1
  const blocIndex = allLeccions?.findIndex(l => l.nom === leccion) ?? 0
  const subtemesBlocActual = allSubtemes?.filter(s => s.leccion === leccion).map(s => s.nom) ?? []
  const pes = derivarPes(leccion, totalBlocs, blocIndex)

  const modulContext: ModulContext = {
    nom: modulo,
    descripcio: `${totalBlocs} blocs, ${totalSubtemes} subtemes en total`,
    totalSubtemes,
    blocActual: leccion,
    descripcioBloc: leccion,
    subtemesBlocActual,
    pesBlocActual: pes,
  }

  const historial = historialData?.map(row =>
    `[${row.leccion} > ${row.subtema}]\n${row.contenido}`
  ).join('\n\n---\n\n') ?? ''

  const materialReferencia = materialData?.contingut ?? undefined

  const systemPrompt = getSystemPromptContenido(historial, modulContext, palabras, idioma, materialReferencia)

  const idiomaLabel = IDIOMA_LABELS[idioma] ?? idioma
  const userMessage = `Escriu el contingut educatiu complet per a aquest subtema en ${idiomaLabel}.

Mòdul: ${modulo}
Bloc: ${leccion}
Subtema: ${subtema}

Analitza el tema, escull el format més adequat i escriu el contingut. Text fluid en paràgrafs, sense activitats ni exercicis (els reptes es generen per separat). Llest per inserir al curs.`

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
