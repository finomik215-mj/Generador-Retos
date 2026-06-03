'use client'

import { useState } from 'react'

interface OutputPanelProps {
  output: string
  loading: boolean
}

export default function OutputPanel({ output, loading }: OutputPanelProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !output) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-finomik-light2 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    )
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
        <div className="text-5xl">🎯</div>
        <p className="font-extrabold text-finomik-blue text-lg">Los retos aparecerán aquí</p>
        <p className="text-finomik-mid3 text-sm max-w-xs">
          Pega el contenido de tu lección, elige los tipos de reto y pulsa &quot;Generar retos&quot;.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className="text-sm font-medium text-finomik-blue border border-finomik-light2 px-4 py-2 rounded-lg hover:bg-finomik-light2 transition"
        >
          {copied ? 'Copiado' : 'Copiar todo'}
        </button>
      </div>
      <div className="whitespace-pre-wrap text-finomik-blue font-montserrat text-sm leading-relaxed">
        {output}
      </div>
    </div>
  )
}
