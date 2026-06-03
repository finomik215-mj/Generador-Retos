import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPrompt } from '@/lib/systemPrompt'
import { buildUserMessage } from '@/lib/buildUserMessage'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { content, selectedTypes } = await req.json() as {
    content: string
    selectedTypes: number[] | 'recommended'
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Contenido vacío' }, { status: 400 })
  }

  const systemPrompt = getSystemPrompt()
  const userMessage = buildUserMessage(content, selectedTypes)

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
