'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import ContentInput from '@/components/ContentInput'
import TypeSelector from '@/components/TypeSelector'
import GenerateButton from '@/components/GenerateButton'
import OutputPanel from '@/components/OutputPanel'
import IndiceView from '@/components/IndiceView'
import ContenidoGenerador from '@/components/ContenidoGenerador'
import SubtemaSelector from '@/components/SubtemaSelector'

type Tab = 'indice' | 'contenido' | 'retos'

interface SubtemaSeleccionado {
  modulo: string
  leccion: string
  subtema: string
  pregunta_numero: number
  pregunta_texto: string
}

interface RetosMeta {
  modulo: string
  leccion: string
  subtema: string
  pregunta_numero: number
  pregunta_texto: string
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('indice')

  const [selectedSubtema, setSelectedSubtema] = useState<SubtemaSeleccionado | null>(null)
  const [retosInput, setRetosInput] = useState('')
  const [retosMeta, setRetosMeta] = useState<RetosMeta | null>(null)

  const [content, setContent] = useState('')
  const [recommended, setRecommended] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<number[]>([])
  const [output, setOutput] = useState('')
  const [loadingRetos, setLoadingRetos] = useState(false)
  const [errorRetos, setErrorRetos] = useState('')
  const [guardandoRetos, setGuardandoRetos] = useState(false)
  const [retosGuardados, setRetosGuardados] = useState(false)

  const [indiceKey, setIndiceKey] = useState(0)

  const [retosSubtemaLabel, setRetosSubtemaLabel] = useState<string | null>(null)
  const [retosSubtemaNoContenido, setRetosSubtemaNoContenido] = useState(false)

  function handleSelectSubtema(item: SubtemaSeleccionado) {
    setSelectedSubtema(item)
    setTab('contenido')
  }

  function handleGenerarRetos(contenido: string, meta: RetosMeta) {
    setRetosInput(contenido)
    setRetosMeta(meta)
    setContent(contenido)
    setOutput('')
    setRetosGuardados(false)
    setTab('retos')
  }

  function handleAprobado() {
    setIndiceKey(k => k + 1)
  }

  async function handleRetosSubtemaSelect(item: { modulo: string; leccion: string; subtema: string; pregunta_numero: number; pregunta_texto: string }) {
    setRetosSubtemaLabel(`${item.subtema} — Pregunta ${item.pregunta_numero}`)
    setRetosSubtemaNoContenido(false)
    const params = new URLSearchParams({
      modulo: item.modulo,
      leccion: item.leccion,
      subtema: item.subtema,
      pregunta_numero: String(item.pregunta_numero),
    })
    const res = await fetch(`/api/contenido/obtener?${params}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.data?.contenido) {
      setContent(data.data.contenido)
      setRetosMeta({
        modulo: item.modulo,
        leccion: item.leccion,
        subtema: item.subtema,
        pregunta_numero: item.pregunta_numero,
        pregunta_texto: item.pregunta_texto,
      })
    } else {
      setRetosSubtemaNoContenido(true)
    }
  }

  const canGenerateRetos = content.trim().length > 0 && (recommended || selectedTypes.length > 0)

  async function handleGenerateRetos() {
    setLoadingRetos(true)
    setOutput('')
    setErrorRetos('')
    setRetosGuardados(false)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        selectedTypes: recommended ? 'recommended' : selectedTypes,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setErrorRetos(data.error ?? 'Error desconegut')
      setLoadingRetos(false)
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
    setLoadingRetos(false)
  }

  async function handleGuardarRetos() {
    if (!retosMeta || !output.trim()) return
    setGuardandoRetos(true)
    const res = await fetch('/api/retos/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo: retosMeta.modulo,
        leccion: retosMeta.leccion,
        subtema: retosMeta.subtema,
        pregunta_numero: retosMeta.pregunta_numero,
        pregunta_texto: retosMeta.pregunta_texto,
        tipo_reto: 'Generat per Claude',
        datos: { raw: output },
        aprobado: false,
      }),
    })
    if (res.ok) {
      setRetosGuardados(true)
      setIndiceKey(k => k + 1)
    }
    setGuardandoRetos(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'indice', label: 'Índex' },
    { id: 'contenido', label: 'Contingut' },
    { id: 'retos', label: 'Generador de reptes' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="border-b border-finomik-light2 px-6">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-extrabold transition border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-finomik-blue text-finomik-blue'
                  : 'border-transparent text-finomik-mid3 hover:text-finomik-blue'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'indice' && (
        <main className="flex-1 overflow-y-auto bg-white">
          <IndiceView key={indiceKey} onSelectSubtema={handleSelectSubtema} />
        </main>
      )}

      {tab === 'contenido' && (
        <main className="flex-1 flex overflow-hidden">
          <ContenidoGenerador
            preloaded={selectedSubtema}
            onAprobado={handleAprobado}
            onGenerarRetos={handleGenerarRetos}
          />
        </main>
      )}

      {tab === 'retos' && (
        <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
          <aside className="w-full lg:w-2/5 border-r border-finomik-light2 p-6 flex flex-col gap-6 overflow-y-auto">
            <SubtemaSelector
              label="Carregar contingut d'una pregunta"
              onSelect={handleRetosSubtemaSelect}
            />
            {retosSubtemaLabel && !retosSubtemaNoContenido && (
              <p className="text-xs text-green-700 font-extrabold bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                Contingut carregat de: {retosSubtemaLabel}
              </p>
            )}
            {retosSubtemaNoContenido && (
              <p className="text-xs text-finomik-mid3 bg-finomik-light2/40 border border-finomik-light2 rounded-xl px-3 py-2">
                Aquesta pregunta encara no té contingut aprovat.
              </p>
            )}
            <ContentInput value={content} onChange={setContent} disabled={loadingRetos} />
            <TypeSelector
              recommended={recommended}
              selected={selectedTypes}
              onRecommendedChange={setRecommended}
              onSelectedChange={setSelectedTypes}
              disabled={loadingRetos}
            />
            <GenerateButton
              onClick={handleGenerateRetos}
              disabled={!canGenerateRetos || loadingRetos}
              loading={loadingRetos}
            />
            {errorRetos && <p className="text-red-500 text-sm text-center">{errorRetos}</p>}
          </aside>
          <section className="flex-1 p-6 overflow-y-auto bg-white flex flex-col gap-4">
            <OutputPanel output={output} loading={loadingRetos} />
            {!loadingRetos && output && retosMeta && (
              <div className="shrink-0 pt-2">
                {retosGuardados ? (
                  <div className="flex items-center gap-2 text-green-700 font-extrabold text-sm">
                    <span>Reptes desats a l'índex</span>
                  </div>
                ) : (
                  <button
                    onClick={handleGuardarRetos}
                    disabled={guardandoRetos}
                    className="bg-finomik-gold text-finomik-blue font-extrabold text-sm px-6 py-2.5 rounded-xl hover:bg-finomik-gold/80 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {guardandoRetos ? 'Desant...' : "Desar reptes a l'índex"}
                  </button>
                )}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  )
}
