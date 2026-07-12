'use client'

import { useState, useEffect, useCallback } from 'react'
import SubtemaSelector from './SubtemaSelector'
import RetoCreador from './RetoCreador'

type Idioma = 'ca' | 'es' | 'en'
type Pes = 'lleuger' | 'normal' | 'intens'

interface ActiveSubtema {
  modulo: string
  leccion: string
  subtema: string
  pes: Pes
}

const PARAULES_PER_PES: Record<Pes, number> = {
  lleuger: 650,
  normal: 1000,
  intens: 1300,
}

const FACTOR_PER_MODUL: Record<string, number> = {
  'Módulo General': 1.0,
  'Introducción a la Inversión': 0.94,
  'Vida Adulta': 0.78,
  'Emprendimiento': 1.0,
  'Economía 1º de Bachillerato': 1.0,
}

function calcularParaules(modulo: string, pes: Pes): number {
  const base = PARAULES_PER_PES[pes]
  const factor = FACTOR_PER_MODUL[modulo] ?? 1.0
  return Math.round(base * factor / 10) * 10
}

interface Props {
  preloaded?: ActiveSubtema | null
  onAprobado: () => void
  onGenerarRetos: (contenido: string, meta: ActiveSubtema) => void
}

const IDIOMES: { id: Idioma; label: string }[] = [
  { id: 'ca', label: 'Català' },
  { id: 'es', label: 'Castellano' },
  { id: 'en', label: 'English' },
]

export default function ContenidoGenerador({ preloaded, onAprobado, onGenerarRetos }: Props) {
  const [idioma, setIdioma] = useState<Idioma>('ca')
  const [output, setOutput] = useState('')
  const [editado, setEditado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aprobando, setAprobando] = useState(false)
  const [aprobado, setAprobado] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showRetoCreador, setShowRetoCreador] = useState(false)

  const [activeSubtema, setActiveSubtema] = useState<ActiveSubtema | null>(preloaded ?? null)

  const [materialReferencia, setMaterialReferencia] = useState('')
  const [savingMaterial, setSavingMaterial] = useState(false)
  const [materialSaved, setMaterialSaved] = useState(false)
  const [showMaterial, setShowMaterial] = useState(false)

  useEffect(() => {
    if (preloaded) setActiveSubtema(preloaded)
  }, [preloaded])

  useEffect(() => {
    setOutput('')
    setEditado('')
    setError('')
    setAprobado(false)
    setShowRetoCreador(false)
  }, [activeSubtema?.subtema, activeSubtema?.leccion, activeSubtema?.modulo])

  useEffect(() => {
    setOutput('')
    setEditado('')
    setAprobado(false)
  }, [idioma])

  const loadExistingContent = useCallback(async (s: ActiveSubtema, lang: Idioma) => {
    const params = new URLSearchParams({ modulo: s.modulo, leccion: s.leccion, subtema: s.subtema, idioma: lang })
    const res = await fetch(`/api/contenido/obtener?${params}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.data?.contenido) {
      setOutput(data.data.contenido)
      setAprobado(true)
    }
  }, [])

  useEffect(() => {
    if (activeSubtema) loadExistingContent(activeSubtema, idioma)
  }, [activeSubtema, idioma, loadExistingContent])

  const loadMaterial = useCallback(async (modul: string) => {
    const res = await fetch(`/api/materials?modul=${encodeURIComponent(modul)}`)
    if (!res.ok) return
    const data = await res.json()
    setMaterialReferencia(data.contingut ?? '')
  }, [])

  useEffect(() => {
    if (activeSubtema?.modulo) loadMaterial(activeSubtema.modulo)
  }, [activeSubtema?.modulo, loadMaterial])

  async function handleSaveMaterial() {
    if (!activeSubtema?.modulo) return
    setSavingMaterial(true)
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modul: activeSubtema.modulo, contingut: materialReferencia }),
    })
    setSavingMaterial(false)
    if (res.ok) {
      setMaterialSaved(true)
      setTimeout(() => setMaterialSaved(false), 2000)
    }
  }

  const textoActual = editado || output

  const canGenerate = activeSubtema &&
    activeSubtema.modulo.trim() &&
    activeSubtema.leccion.trim() &&
    activeSubtema.subtema.trim()

  async function handleGenerar() {
    if (!activeSubtema) return
    setLoading(true)
    setOutput('')
    setEditado('')
    setError('')
    setAprobado(false)

    const res = await fetch('/api/contenido/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo: activeSubtema.modulo,
        leccion: activeSubtema.leccion,
        subtema: activeSubtema.subtema,
        palabras: calcularParaules(activeSubtema.modulo, activeSubtema.pes),
        idioma,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error desconegut')
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

  async function handleAprobar() {
    if (!activeSubtema) return
    setAprobando(true)
    setError('')
    const res = await fetch('/api/contenido/aprobar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo: activeSubtema.modulo,
        leccion: activeSubtema.leccion,
        subtema: activeSubtema.subtema,
        contenido: textoActual,
        idioma,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error en desar')
    } else {
      setAprobado(true)
      onAprobado()
    }
    setAprobando(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(textoActual)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleGenerarRetos() {
    if (!activeSubtema) return
    onGenerarRetos(textoActual, activeSubtema)
  }

  const wordCount = textoActual.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden">
      {/* Left panel */}
      <aside className="w-full lg:w-2/5 border-r border-finomik-light2 p-6 flex flex-col gap-5 overflow-y-auto">
        <SubtemaSelector
          label="Seleccionar subtema"
          onSelect={(item) => setActiveSubtema(item)}
        />

        {!activeSubtema && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="text-4xl">✍️</div>
            <p className="font-extrabold text-finomik-blue text-base">Selecciona un subtema</p>
            <p className="text-finomik-mid3 text-sm max-w-xs">
              Utilitza el selector de dalt o vés a l'índex i fes clic en un subtema.
            </p>
          </div>
        )}

        {activeSubtema && (
          <div className="flex flex-col gap-3">
            {[
              { label: 'Mòdul', value: activeSubtema.modulo },
              { label: 'Bloc', value: activeSubtema.leccion },
              { label: 'Subtema', value: activeSubtema.subtema },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">{label}</span>
                <div className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-mid2 bg-finomik-light2/20">
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Language tabs */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">Idioma del contingut</span>
          <div className="flex gap-1 border border-finomik-light2 rounded-xl p-1">
            {IDIOMES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setIdioma(id)}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition ${
                  idioma === id
                    ? 'bg-finomik-blue text-white'
                    : 'text-finomik-mid3 hover:text-finomik-blue'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Word count — auto per pes del bloc */}
        {activeSubtema && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">
              Objectiu de paraules
            </span>
            <div className="flex items-center justify-between border border-finomik-light2 rounded-xl px-4 py-2.5 bg-finomik-light2/20">
              <span className="text-sm text-finomik-mid2">
                {activeSubtema.pes === 'lleuger' ? 'Introductori' : activeSubtema.pes === 'intens' ? 'Intens' : 'Estàndard'}
              </span>
              <span className="text-sm font-extrabold text-finomik-blue">
                {calcularParaules(activeSubtema.modulo, activeSubtema.pes)} pal.
              </span>
            </div>
          </div>
        )}

        {/* Reference material (collapsible) */}
        {activeSubtema && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowMaterial(v => !v)}
              className="flex items-center justify-between text-xs font-extrabold text-finomik-blue uppercase tracking-wide"
            >
              <span>Material de referència</span>
              <span className="text-finomik-mid3 normal-case font-medium">
                {showMaterial ? 'Amagar' : 'Veure / editar'}
              </span>
            </button>
            {showMaterial && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-finomik-mid3 leading-relaxed">
                  Enganxa aquí textos, guies o contingut de referència per a tot el mòdul <strong className="text-finomik-blue">{activeSubtema.modulo}</strong>. Claude l'usarà com a base per generar contingut precís.
                </p>
                <textarea
                  value={materialReferencia}
                  onChange={e => setMaterialReferencia(e.target.value)}
                  rows={6}
                  placeholder="Enganxa aquí el contingut de referència (guies, PDFs convertits a text, dades oficials...)"
                  className="border border-finomik-light2 rounded-xl px-4 py-3 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 resize-none"
                />
                <button
                  onClick={handleSaveMaterial}
                  disabled={savingMaterial}
                  className="self-end text-xs font-extrabold bg-finomik-blue text-white px-4 py-2 rounded-lg hover:bg-finomik-mid1 transition disabled:opacity-40"
                >
                  {savingMaterial ? 'Desant...' : materialSaved ? 'Desat' : 'Desar material'}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGenerar}
          disabled={!canGenerate || loading}
          className="w-full py-3 rounded-2xl font-extrabold text-sm transition bg-finomik-blue text-white hover:bg-finomik-mid1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Generant...' : 'Generar contingut'}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </aside>

      {/* Right panel */}
      <section className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-white">
        {loading && !output ? (
          <div className="flex flex-col gap-4 animate-pulse p-2">
            <div className="h-4 bg-finomik-light2 rounded w-3/4" />
            <div className="h-4 bg-finomik-light2 rounded w-full" />
            <div className="h-4 bg-finomik-light2 rounded w-5/6" />
            <div className="h-4 bg-finomik-light2 rounded w-full" />
            <div className="h-4 bg-finomik-light2 rounded w-2/3" />
          </div>
        ) : !output && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
            <div className="text-5xl">✍️</div>
            <p className="font-extrabold text-finomik-blue text-lg">El contingut apareixerà aquí</p>
            <p className="text-finomik-mid3 text-sm max-w-xs">
              Selecciona subtema, tria l'idioma i prem Generar contingut.
            </p>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <p className="text-finomik-mid3 text-sm font-medium">
                  <span className="font-extrabold text-finomik-blue">{wordCount}</span> paraules
                  {loading && <span className="ml-2 animate-pulse text-xs">generant...</span>}
                </p>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-finomik-blue/10 text-finomik-blue uppercase">
                  {idioma}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs font-medium text-finomik-blue border border-finomik-light2 px-3 py-1.5 rounded-lg hover:bg-finomik-light2 transition"
                >
                  {copied ? 'Copiat' : 'Copiar'}
                </button>
                {!loading && output && !aprobado && (
                  <button
                    onClick={handleAprobar}
                    disabled={aprobando}
                    className="text-xs font-extrabold bg-finomik-blue text-white px-4 py-1.5 rounded-lg hover:bg-finomik-mid1 transition disabled:opacity-50"
                  >
                    {aprobando ? 'Desant...' : 'Aprovar i desar'}
                  </button>
                )}
                {aprobado && (
                  <span className="text-xs font-extrabold text-green-600 border border-green-200 bg-green-50 px-4 py-1.5 rounded-lg">
                    Desat ({idioma.toUpperCase()})
                  </span>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 bg-white border border-finomik-light2 rounded-2xl p-6 overflow-y-auto min-h-48">
              {loading ? (
                <p className="text-finomik-blue text-base leading-relaxed whitespace-pre-wrap">
                  {output}
                </p>
              ) : (
                <textarea
                  value={textoActual}
                  onChange={e => setEditado(e.target.value)}
                  className="w-full h-full min-h-48 text-finomik-blue text-base leading-relaxed resize-none focus:outline-none"
                  placeholder="El contingut generat apareixerà aquí. Pots editar-lo abans d'aprovar-lo."
                />
              )}
            </div>

            {/* Actions after approval */}
            {!loading && output && aprobado && activeSubtema && (
              <div className="flex flex-col gap-3 shrink-0">
                <div className="bg-finomik-gold/10 border border-finomik-gold rounded-xl px-4 py-3 flex flex-col gap-3">
                  <p className="text-sm font-extrabold text-finomik-blue">Contingut aprovat ({idioma.toUpperCase()}). Que vols fer ara?</p>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={handleGenerarRetos}
                      className="bg-finomik-gold text-finomik-blue font-extrabold text-sm px-5 py-2.5 rounded-xl hover:bg-finomik-gold/80 transition"
                    >
                      Generar reptes amb Claude
                    </button>
                    <button
                      onClick={() => setShowRetoCreador(v => !v)}
                      className="bg-white border border-finomik-blue text-finomik-blue font-extrabold text-sm px-5 py-2.5 rounded-xl hover:bg-finomik-blue/5 transition"
                    >
                      {showRetoCreador ? 'Ocultar creador manual' : 'Crear repte manualment'}
                    </button>
                  </div>
                </div>

                {showRetoCreador && (
                  <div className="border border-finomik-light2 rounded-2xl p-5 bg-white">
                    <RetoCreador
                      modulo={activeSubtema.modulo}
                      leccion={activeSubtema.leccion}
                      subtema={activeSubtema.subtema}
                      onGuardado={() => { setShowRetoCreador(false); onAprobado() }}
                      onCancel={() => setShowRetoCreador(false)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Notice when not yet approved */}
            {!loading && output && !aprobado && (
              <div className="bg-finomik-gold/10 border border-finomik-gold rounded-xl px-4 py-3 shrink-0">
                <p className="text-sm text-finomik-blue">
                  <span className="font-extrabold">Satisfet amb el contingut?</span> Aprova i desa primer, després genera els reptes.
                </p>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
