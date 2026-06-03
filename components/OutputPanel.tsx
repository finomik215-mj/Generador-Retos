'use client'

import { useState, useEffect } from 'react'

interface OutputPanelProps {
  output: string
  loading: boolean
}

function parseRetos(text: string): string[] {
  return text
    .split(/\n---\n/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
}

function RetoCard({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim())

  return (
    <div className="flex flex-col gap-4">
      {lines.map((line, i) => {
        if (line.startsWith('**Tipo:**')) {
          const value = line.replace('**Tipo:**', '').trim()
          return (
            <div key={i} className="flex gap-2 flex-wrap">
              <span className="bg-finomik-blue text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
                {value}
              </span>
            </div>
          )
        }
        if (line.startsWith('**Subtema:**')) {
          const value = line.replace('**Subtema:**', '').trim()
          return (
            <p key={i} className="text-finomik-mid3 text-xs font-medium uppercase tracking-wide">
              {value}
            </p>
          )
        }
        if (line.startsWith('**Pregunta')) {
          return (
            <p key={i} className="text-finomik-blue font-extrabold text-xs uppercase tracking-wide mt-2">
              Pregunta
            </p>
          )
        }
        if (line.startsWith('**Opciones:**')) {
          return (
            <p key={i} className="text-finomik-blue font-extrabold text-xs uppercase tracking-wide mt-2">
              Opciones
            </p>
          )
        }
        if (line.startsWith('**Feedback correcto:**')) {
          const value = line.replace('**Feedback correcto:**', '').trim()
          return (
            <div key={i} className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-xs font-extrabold text-green-700 uppercase tracking-wide mb-1">Correcto</p>
              <p className="text-sm text-green-800">{value}</p>
            </div>
          )
        }
        if (line.startsWith('**Feedback incorrecto:**')) {
          const value = line.replace('**Feedback incorrecto:**', '').trim()
          return (
            <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-xs font-extrabold text-red-700 uppercase tracking-wide mb-1">Incorrecto</p>
              <p className="text-sm text-red-800">{value}</p>
            </div>
          )
        }
        if (line.match(/^- [A-Z]\)/)) {
          const isCorrect = line.includes('✓')
          const optionText = line.replace(/^- /, '').replace(' ✓', '')
          return (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
                isCorrect
                  ? 'bg-finomik-gold/10 border-finomik-gold text-finomik-blue font-medium'
                  : 'bg-white border-finomik-light2 text-finomik-mid1'
              }`}
            >
              <span className="text-sm flex-1">{optionText}</span>
              {isCorrect && <span className="text-finomik-gold font-black text-sm">✓</span>}
            </div>
          )
        }
        if (line && !line.startsWith('**') && !line.startsWith('-')) {
          return (
            <p key={i} className="text-finomik-blue text-base leading-relaxed">
              {line}
            </p>
          )
        }
        return null
      })}
    </div>
  )
}

export default function OutputPanel({ output, loading }: OutputPanelProps) {
  const [page, setPage] = useState(0)
  const [copied, setCopied] = useState(false)

  const retos = parseRetos(output)
  const total = retos.length

  useEffect(() => {
    setPage(0)
  }, [loading])

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !output) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-2">
        <div className="h-6 bg-finomik-light2 rounded w-1/3" />
        <div className="h-4 bg-finomik-light2 rounded w-1/2" />
        <div className="h-16 bg-finomik-light2 rounded w-full mt-4" />
        <div className="h-10 bg-finomik-light2 rounded w-full" />
        <div className="h-10 bg-finomik-light2 rounded w-full" />
        <div className="h-10 bg-finomik-light2 rounded w-full" />
      </div>
    )
  }

  if (!output && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
        <div className="text-5xl">🎯</div>
        <p className="font-extrabold text-finomik-blue text-lg">Los retos aparecerán aquí</p>
        <p className="text-finomik-mid3 text-sm max-w-xs">
          Pega el contenido de tu lección, elige los tipos de reto y pulsa Generar retos.
        </p>
      </div>
    )
  }

  if (total === 0 && output) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-finomik-mid3 text-sm animate-pulse">Generando retos...</p>
      </div>
    )
  }

  const current = retos[page] ?? ''

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <p className="text-finomik-mid3 text-sm font-medium">
          Reto{' '}
          <span className="font-extrabold text-finomik-blue">{page + 1}</span>{' '}
          de {total}
          {loading && (
            <span className="ml-2 animate-pulse text-xs">generando...</span>
          )}
        </p>
        <button
          onClick={handleCopy}
          className="text-xs font-medium text-finomik-blue border border-finomik-light2 px-3 py-1.5 rounded-lg hover:bg-finomik-light2 transition"
        >
          {copied ? 'Copiado' : 'Copiar todo'}
        </button>
      </div>

      <div className="flex-1 bg-white border border-finomik-light2 rounded-2xl p-6 overflow-y-auto">
        <RetoCard text={current} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 rounded-xl border border-finomik-light2 text-finomik-blue text-sm font-medium disabled:opacity-30 hover:bg-finomik-light2 transition"
        >
          Anterior
        </button>

        <div className="flex gap-1.5">
          {retos.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-2 h-2 rounded-full transition ${
                i === page ? 'bg-finomik-blue' : 'bg-finomik-light2'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setPage(p => Math.min(total - 1, p + 1))}
          disabled={page === total - 1}
          className="px-4 py-2 rounded-xl border border-finomik-light2 text-finomik-blue text-sm font-medium disabled:opacity-30 hover:bg-finomik-light2 transition"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
