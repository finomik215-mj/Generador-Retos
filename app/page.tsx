'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import ContentInput from '@/components/ContentInput'
import TypeSelector from '@/components/TypeSelector'
import GenerateButton from '@/components/GenerateButton'
import OutputPanel from '@/components/OutputPanel'

export default function HomePage() {
  const [content, setContent] = useState('')
  const [recommended, setRecommended] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<number[]>([])
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canGenerate = content.trim().length > 0 && (recommended || selectedTypes.length > 0)

  async function handleGenerate() {
    setLoading(true)
    setOutput('')
    setError('')

    const body = {
      content,
      selectedTypes: recommended ? 'recommended' : selectedTypes,
    }

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error desconocido')
      setLoading(false)
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setOutput(prev => prev + decoder.decode(value, { stream: true }))
    }
    setOutput(prev => prev + decoder.decode())

    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left panel */}
        <aside className="w-full lg:w-2/5 border-r border-finomik-light2 p-6 flex flex-col gap-6 overflow-y-auto">
          <ContentInput value={content} onChange={setContent} disabled={loading} />
          <TypeSelector
            recommended={recommended}
            selected={selectedTypes}
            onRecommendedChange={setRecommended}
            onSelectedChange={setSelectedTypes}
            disabled={loading}
          />
          <GenerateButton onClick={handleGenerate} disabled={!canGenerate || loading} loading={loading} />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </aside>

        {/* Right panel */}
        <section className="flex-1 p-6 overflow-y-auto bg-white">
          <OutputPanel output={output} loading={loading} />
        </section>
      </main>
    </div>
  )
}
