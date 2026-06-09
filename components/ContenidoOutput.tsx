'use client'

import { useState } from 'react'

interface ContenidoOutputProps {
  output: string
  loading: boolean
  modulo: string
  leccion: string
  subtema: string
  preguntas: string
  onAprobado: () => void
}

export default function ContenidoOutput({
  output,
  loading,
  modulo,
  leccion,
  subtema,
  preguntas,
  onAprobado,
}: ContenidoOutputProps) {
  const [editado, setEditado] = useState('')
  const [aprobando, setAprobando] = useState(false)
  const [aprobado, setAprobado] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Sync editado with output when output changes (streaming)
  const textoActual = editado || output

  async function handleAprobar() {
    setAprobando(true)
    setError('')
    const res = await fetch('/api/contenido/aprobar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modulo, leccion, subtema, preguntas, contenido: textoActual }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error en desar')
    } else {
      setAprobado(true)
      onAprobado()
      setTimeout(() => setAprobado(false), 3000)
    }
    setAprobando(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(textoActual)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !output) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-2">
        <div className="h-4 bg-finomik-light2 rounded w-3/4" />
        <div className="h-4 bg-finomik-light2 rounded w-full" />
        <div className="h-4 bg-finomik-light2 rounded w-5/6" />
        <div className="h-4 bg-finomik-light2 rounded w-full" />
        <div className="h-4 bg-finomik-light2 rounded w-2/3" />
      </div>
    )
  }

  if (!output && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
        <div className="text-5xl">✍️</div>
        <p className="font-extrabold text-finomik-blue text-lg">El contingut apareixerà aquí</p>
        <p className="text-finomik-mid3 text-sm max-w-xs">
          Omple els camps de l'esquerra i prem Generar contingut.
        </p>
      </div>
    )
  }

  const wordCount = textoActual.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-finomik-mid3 text-sm font-medium">
          <span className="font-extrabold text-finomik-blue">{wordCount}</span> palabras
          {loading && <span className="ml-2 animate-pulse text-xs">generant...</span>}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs font-medium text-finomik-blue border border-finomik-light2 px-3 py-1.5 rounded-lg hover:bg-finomik-light2 transition"
          >
            {copied ? 'Copiat' : 'Copiar'}
          </button>
          {!loading && output && (
            <button
              onClick={handleAprobar}
              disabled={aprobando}
              className="text-xs font-extrabold bg-finomik-blue text-white px-4 py-1.5 rounded-lg hover:bg-finomik-mid1 transition disabled:opacity-50"
            >
              {aprobando ? 'Desant...' : aprobado ? '✓ Desat' : 'Aprovar i desar'}
            </button>
          )}
        </div>
      </div>

      {/* Content area - editable */}
      <div className="flex-1 bg-white border border-finomik-light2 rounded-2xl p-6 overflow-y-auto">
        {loading ? (
          <p className="text-finomik-blue text-base leading-relaxed whitespace-pre-wrap">{output}</p>
        ) : (
          <textarea
            value={editado || output}
            onChange={e => setEditado(e.target.value)}
            className="w-full h-full min-h-64 text-finomik-blue text-base leading-relaxed resize-none focus:outline-none"
            placeholder="El contingut generat apareixerà aquí. Pots editar-lo abans d'aprovar-lo."
          />
        )}
      </div>

      {/* Approve notice */}
      {!loading && output && (
        <div className="bg-finomik-gold/10 border border-finomik-gold rounded-xl px-4 py-3">
          <p className="text-sm text-finomik-blue">
            <span className="font-extrabold">Satisfet amb el contingut?</span> Prem{' '}
            <span className="font-extrabold">Aprovar i desar</span> perquè Claude ho recordi
            en generar els subtemes següents. Pots editar el text abans d'aprovar-lo.
          </p>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      )}
    </div>
  )
}
