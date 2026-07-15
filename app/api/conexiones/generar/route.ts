import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPromptConexiones, type GuiaConexiones } from '@/lib/systemPromptConexiones'
import { tieneCurriculoLibro, getConexionLibro, getCurriculoLibro } from '@/lib/curriculoLibros'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { modulo } = await req.json() as { modulo: string }

  if (!tieneCurriculoLibro(modulo)) {
    return NextResponse.json({ error: 'La guia de connexions curriculars només està disponible per als mòduls amb llibre oficial (Economia).' }, { status: 400 })
  }

  const [{ data: leccionsRaw }, { data: subtemesRaw }] = await Promise.all([
    supabase.from('leccions').select('nom, ordre').eq('modulo', modulo).order('ordre', { ascending: true }),
    supabase.from('subtemes').select('leccion, nom').eq('modulo', modulo),
  ])
  const leccions = leccionsRaw ?? []
  const subtemes = subtemesRaw ?? []
  if (leccions.length === 0) {
    return NextResponse.json({ error: 'El mòdul no té estructura (blocs) a Supabase' }, { status: 400 })
  }

  const bloques = leccions.map(l => {
    const subs = subtemes.filter(s => s.leccion === l.nom).map(s => `    - ${s.nom}`).join('\n')
    const conexion = getConexionLibro(modulo, l.nom) ?? '(sin conexión curricular registrada)'
    return `[${l.nom}]\n${subs}\n  CONEXIÓN CURRICULAR (dada, no la cambies): ${conexion}`
  }).join('\n\n')

  const userMessage = `MÓDULO: ${modulo}

${getCurriculoLibro(modulo) ?? ''}

BLOQUES DEL MÓDULO (en este orden), con sus subtemas y su conexión curricular ya fijada:
${bloques}

Escribe la guía de adaptación curricular y responde SOLO con el JSON del esquema.`

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

  let raw = ''
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: getSystemPromptConexiones(modulo),
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

  let parsed: Omit<GuiaConexiones, 'modulo'>
  try {
    parsed = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return NextResponse.json({ error: 'JSON invàlid (potser truncat)', raw: raw.slice(-500) }, { status: 502 })
  }

  const guia: GuiaConexiones = {
    modulo,
    intro: parsed.intro ?? '',
    bloques: parsed.bloques ?? [],
  }

  return NextResponse.json(guia)
}
