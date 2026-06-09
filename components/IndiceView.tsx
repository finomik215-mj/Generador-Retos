'use client'

import { useState, useEffect, useCallback } from 'react'
import { RetoGuardado } from '@/lib/supabase'

interface SubtemaItem {
  id: string
  modulo: string
  leccion: string
  subtema: string
  pregunta_1: string
  pregunta_2: string
  pregunta_3: string
  created_at: string
}

interface ContenidoStatus {
  modulo: string
  leccion: string
  subtema: string
  pregunta_numero: number
  id: string
}

interface Props {
  onSelectSubtema: (item: {
    modulo: string
    leccion: string
    subtema: string
    pregunta_numero: number
    pregunta_texto: string
  }) => void
}

interface QuestionExpandedData {
  contenido: { id: string; contenido: string } | null
  retos: RetoGuardado[]
  loading: boolean
}

function QuestionRow({
  modulo, leccion, subtema, pregunta_numero, pregunta_texto,
  hasContent, hasRetos,
  onSelect, onRefresh
}: {
  modulo: string; leccion: string; subtema: string
  pregunta_numero: number; pregunta_texto: string
  hasContent: boolean; hasRetos: boolean
  onSelect: () => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<QuestionExpandedData>({ contenido: null, retos: [], loading: false })

  async function fetchData() {
    setData(prev => ({ ...prev, loading: true }))
    const params = new URLSearchParams({ modulo, leccion, subtema, pregunta_numero: String(pregunta_numero) })
    const [cRes, rRes] = await Promise.all([
      fetch(`/api/contenido/obtener?${params}`),
      fetch(`/api/retos/listar?${params}`),
    ])
    const cData = cRes.ok ? (await cRes.json()) : { data: null }
    const rData = rRes.ok ? (await rRes.json()) : { data: [] }
    setData({
      contenido: cData.data ? { id: cData.data.id, contenido: cData.data.contenido } : null,
      retos: rData.data ?? [],
      loading: false,
    })
  }

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (next) fetchData()
  }

  async function handleDeleteContenido(id: string) {
    if (!confirm('Eliminar aquest contingut aprovat?')) return
    await fetch('/api/contenido/eliminar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchData()
    onRefresh()
  }

  async function handleDeleteReto(id: string) {
    if (!confirm('Eliminar aquest repte?')) return
    await fetch('/api/retos/eliminar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchData()
    onRefresh()
  }

  return (
    <div className="border-t border-finomik-light2/40 group/q">
      <div className="flex items-center justify-between px-10 py-2.5 hover:bg-finomik-light2/10 transition">
        <button onClick={handleToggle} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className="text-finomik-mid3 text-xs w-3 shrink-0">{expanded ? '▼' : '▶'}</span>
          <span className="text-xs font-extrabold text-finomik-mid3 shrink-0 w-20">Pregunta {pregunta_numero}</span>
          <span className="text-xs text-finomik-mid2 truncate">{pregunta_texto || '(sense text)'}</span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {hasRetos && <span className="bg-finomik-gold/20 text-finomik-blue text-xs font-bold px-1.5 py-0.5 rounded-full">Reptes ✓</span>}
            {hasContent && <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">Contingut ✓</span>}
            {!hasContent && !hasRetos && <span className="bg-finomik-light2 text-finomik-mid3 text-xs font-bold px-1.5 py-0.5 rounded-full">Pendent</span>}
          </div>
        </button>
        <button
          onClick={onSelect}
          className="text-finomik-blue text-xs font-extrabold hover:text-finomik-mid1 transition px-2 py-1 rounded-lg hover:bg-finomik-blue/10 shrink-0 ml-2"
        >
          {hasContent ? '→ Veure' : '→ Generar'}
        </button>
      </div>

      {expanded && (
        <div className="px-12 pb-4 flex flex-col gap-3">
          {data.loading && <p className="text-xs text-finomik-mid3 animate-pulse">Carregant...</p>}

          {!data.loading && data.contenido && (
            <div className="border border-green-200 rounded-xl px-4 py-3 bg-green-50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-green-700 uppercase tracking-wide">Contingut aprovat</span>
                <button
                  onClick={() => handleDeleteContenido(data.contenido!.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-bold transition"
                >
                  Eliminar contingut
                </button>
              </div>
              <p className="text-xs text-finomik-mid2 leading-relaxed">
                {data.contenido.contenido.length > 180
                  ? data.contenido.contenido.slice(0, 180) + '...'
                  : data.contenido.contenido}
              </p>
              <button
                onClick={onSelect}
                className="self-start text-xs font-extrabold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition"
              >
                Veure contingut complet
              </button>
            </div>
          )}

          {!data.loading && !data.contenido && (
            <button
              onClick={onSelect}
              className="self-start text-xs font-extrabold bg-finomik-blue text-white px-4 py-2 rounded-xl hover:bg-finomik-mid1 transition"
            >
              Generar contingut per a aquesta pregunta
            </button>
          )}

          {!data.loading && data.retos.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-finomik-mid3 uppercase tracking-wide">Reptes desats</span>
              {data.retos.map(reto => {
                const firstValue = Object.values(reto.datos ?? {})[0] as string | undefined
                return (
                  <div key={reto.id} className="border border-finomik-light2 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {reto.aprobado && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Aprobado" />}
                      <span className="bg-finomik-blue/10 text-finomik-blue text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0">{reto.tipo_reto}</span>
                      {firstValue && (
                        <span className="text-xs text-finomik-mid2 truncate">
                          {String(firstValue).slice(0, 60)}{String(firstValue).length > 60 ? '...' : ''}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReto(reto.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-bold transition shrink-0"
                    >
                      Eliminar
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IndiceView({ onSelectSubtema }: Props) {
  const [items, setItems] = useState<SubtemaItem[]>([])
  const [contenidoStatus, setContenidoStatus] = useState<ContenidoStatus[]>([])
  const [retosStatus, setRetosStatus] = useState<{ modulo: string; leccion: string; subtema: string; pregunta_numero: number }[]>([])
  const [loading, setLoading] = useState(true)

  const [collapsedModulos, setCollapsedModulos] = useState<Record<string, boolean>>({})
  const [collapsedLecciones, setCollapsedLecciones] = useState<Record<string, boolean>>({})
  const [expandedSubtemas, setExpandedSubtemas] = useState<Record<string, boolean>>({})

  const [pendingModulos, setPendingModulos] = useState<string[]>([])
  const [pendingLecciones, setPendingLecciones] = useState<Record<string, string[]>>({})

  const [addingModulo, setAddingModulo] = useState(false)
  const [newModuloName, setNewModuloName] = useState('')
  const [addingLeccionTo, setAddingLeccionTo] = useState<string | null>(null)
  const [newLeccionName, setNewLeccionName] = useState('')
  const [addingSubtemaTo, setAddingSubtemaTo] = useState<{ modulo: string; leccion: string } | null>(null)
  const [fSubtema, setFSubtema] = useState('')
  const [fP1, setFP1] = useState('')
  const [fP2, setFP2] = useState('')
  const [fP3, setFP3] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [indiceRes, contenidoRes, retosRes] = await Promise.all([
      fetch('/api/indice'),
      fetch('/api/contenido/historial'),
      fetch('/api/retos/listar'),
    ])
    if (indiceRes.ok) setItems((await indiceRes.json()).data ?? [])
    if (contenidoRes.ok) {
      const d = await contenidoRes.json()
      setContenidoStatus((d.data ?? []).map((c: ContenidoStatus) => ({
        modulo: c.modulo, leccion: c.leccion, subtema: c.subtema, pregunta_numero: c.pregunta_numero, id: c.id,
      })))
    }
    if (retosRes.ok) {
      const d = await retosRes.json()
      setRetosStatus((d.data ?? []).map((r: { modulo: string; leccion: string; subtema: string; pregunta_numero: number }) => ({
        modulo: r.modulo, leccion: r.leccion, subtema: r.subtema, pregunta_numero: r.pregunta_numero,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function hasContenido(m: string, l: string, s: string, pn: number) {
    return contenidoStatus.some(c => c.modulo === m && c.leccion === l && c.subtema === s && c.pregunta_numero === pn)
  }
  function hasRetos(m: string, l: string, s: string, pn: number) {
    return retosStatus.some(r => r.modulo === m && r.leccion === l && r.subtema === s && r.pregunta_numero === pn)
  }
  function subtemaHasAnyContent(m: string, l: string, s: string) {
    return contenidoStatus.some(c => c.modulo === m && c.leccion === l && c.subtema === s)
  }
  function subtemaHasAnyRetos(m: string, l: string, s: string) {
    return retosStatus.some(r => r.modulo === m && r.leccion === l && r.subtema === s)
  }

  const tree: Record<string, Record<string, SubtemaItem[]>> = {}
  for (const item of items) {
    if (!tree[item.modulo]) tree[item.modulo] = {}
    if (!tree[item.modulo][item.leccion]) tree[item.modulo][item.leccion] = []
    tree[item.modulo][item.leccion].push(item)
  }

  const allModulos = Array.from(new Set([...Object.keys(tree), ...pendingModulos]))

  function getLeccionesForModulo(modulo: string): string[] {
    const saved = Object.keys(tree[modulo] ?? {})
    const pending = pendingLecciones[modulo] ?? []
    return Array.from(new Set([...saved, ...pending]))
  }

  function handleAddModulo() {
    const name = newModuloName.trim()
    if (!name) return
    if (!allModulos.includes(name)) setPendingModulos(prev => [...prev, name])
    setNewModuloName('')
    setAddingModulo(false)
  }

  function handleAddLeccion(modulo: string) {
    const name = newLeccionName.trim()
    if (!name) return
    setPendingLecciones(prev => ({
      ...prev,
      [modulo]: Array.from(new Set([...(prev[modulo] ?? []), name])),
    }))
    setNewLeccionName('')
    setAddingLeccionTo(null)
  }

  async function handleSaveSubtema() {
    if (!addingSubtemaTo || !fSubtema.trim()) {
      setFormError('El nom del subtema és obligatori.')
      return
    }
    setSubmitting(true)
    setFormError('')
    const res = await fetch('/api/indice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo: addingSubtemaTo.modulo,
        leccion: addingSubtemaTo.leccion,
        subtema: fSubtema.trim(),
        pregunta_1: fP1.trim() || null,
        pregunta_2: fP2.trim() || null,
        pregunta_3: fP3.trim() || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setFormError(data.error ?? 'Error en desar')
      setSubmitting(false)
      return
    }
    setPendingModulos(prev => prev.filter(m => m !== addingSubtemaTo.modulo))
    setPendingLecciones(prev => {
      const updated = { ...prev }
      if (updated[addingSubtemaTo.modulo]) {
        updated[addingSubtemaTo.modulo] = updated[addingSubtemaTo.modulo].filter(l => l !== addingSubtemaTo.leccion)
      }
      return updated
    })
    setFSubtema(''); setFP1(''); setFP2(''); setFP3('')
    setAddingSubtemaTo(null)
    setSubmitting(false)
    fetchAll()
  }

  async function handleDeleteSubtema(id: string) {
    if (!confirm('Eliminar aquest subtema i tot el seu contingut i reptes?')) return
    await fetch('/api/indice', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'subtema', id }),
    })
    fetchAll()
  }

  async function handleDeleteLeccion(modulo: string, leccion: string) {
    if (!confirm(`Eliminar la lliçó "${leccion}" i tot el seu contingut i reptes?`)) return
    await fetch('/api/indice', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'leccion', modulo, leccion }),
    })
    fetchAll()
  }

  async function handleDeleteModulo(modulo: string) {
    if (!confirm(`Eliminar el mòdul "${modulo}" i tot el seu contingut i reptes?`)) return
    await fetch('/api/indice', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'modulo', modulo }),
    })
    fetchAll()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse p-6 max-w-4xl mx-auto w-full">
        <div className="h-5 bg-finomik-light2 rounded w-1/3" />
        <div className="h-4 bg-finomik-light2 rounded w-1/2 ml-4" />
        <div className="h-4 bg-finomik-light2 rounded w-2/5 ml-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-finomik-blue text-xl">Índex del curs</h2>
          <p className="text-finomik-mid3 text-sm mt-0.5">
            {items.length} subtemes · fes clic en una pregunta per generar contingut
          </p>
        </div>
        {!addingModulo && (
          <button
            onClick={() => setAddingModulo(true)}
            className="bg-finomik-blue text-white rounded-2xl px-5 py-2.5 font-extrabold text-sm hover:bg-finomik-mid1 transition"
          >
            + Nou mòdul
          </button>
        )}
      </div>

      {addingModulo && (
        <div className="border border-finomik-blue/30 rounded-2xl p-4 bg-white flex gap-3 items-end shadow-sm">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">Nom del mòdul</label>
            <input
              autoFocus
              value={newModuloName}
              onChange={e => setNewModuloName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddModulo()}
              placeholder="Ex: Mòdul 1 — Els diners i jo"
              className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20"
            />
          </div>
          <button onClick={handleAddModulo} disabled={!newModuloName.trim()} className="bg-finomik-blue text-white rounded-xl px-5 py-2.5 font-extrabold text-sm hover:bg-finomik-mid1 transition disabled:opacity-40">Afegir</button>
          <button onClick={() => { setAddingModulo(false); setNewModuloName('') }} className="border border-finomik-light2 text-finomik-mid3 rounded-xl px-4 py-2.5 text-sm hover:bg-finomik-light2 transition">Cancel·lar</button>
        </div>
      )}

      {allModulos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="text-5xl">📚</div>
          <p className="font-extrabold text-finomik-blue text-lg">L'índex és buit</p>
          <p className="text-finomik-mid3 text-sm max-w-xs">Comença afegint el primer mòdul del curs.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {allModulos.map(modulo => {
          const lecciones = getLeccionesForModulo(modulo)
          const moduloCollapsed = collapsedModulos[modulo] ?? false

          return (
            <div key={modulo} className="border border-finomik-light2 rounded-2xl overflow-hidden">
              <div className="bg-finomik-blue px-5 py-3 flex items-center justify-between group/mod">
                <button
                  onClick={() => setCollapsedModulos(prev => ({ ...prev, [modulo]: !moduloCollapsed }))}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className="text-white text-xs opacity-70 w-4">{moduloCollapsed ? '▶' : '▼'}</span>
                  <h3 className="font-black text-white text-sm">{modulo}</h3>
                </button>
                <div className="flex items-center gap-3">
                  {!moduloCollapsed && (
                    <button
                      onClick={() => { setAddingLeccionTo(modulo); setNewLeccionName(''); setAddingSubtemaTo(null) }}
                      className="text-finomik-gold text-xs font-extrabold hover:text-white transition shrink-0"
                    >
                      + Nova lliçó
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteModulo(modulo)}
                    className="text-red-300 hover:text-red-100 text-xs font-bold transition opacity-0 group-hover/mod:opacity-100 shrink-0"
                  >
                    Eliminar mòdul
                  </button>
                </div>
              </div>

              {!moduloCollapsed && (
                <>
                  {addingLeccionTo === modulo && (
                    <div className="px-5 py-4 bg-finomik-blue/5 border-b border-finomik-light2 flex gap-3 items-end">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">Nom de la lliçó</label>
                        <input
                          autoFocus
                          value={newLeccionName}
                          onChange={e => setNewLeccionName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddLeccion(modulo)}
                          placeholder="Ex: Lliçó 1 — Què són els diners"
                          className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 bg-white"
                        />
                      </div>
                      <button onClick={() => handleAddLeccion(modulo)} disabled={!newLeccionName.trim()} className="bg-finomik-blue text-white rounded-xl px-5 py-2.5 font-extrabold text-sm hover:bg-finomik-mid1 transition disabled:opacity-40">Afegir</button>
                      <button onClick={() => setAddingLeccionTo(null)} className="border border-finomik-light2 text-finomik-mid3 rounded-xl px-4 py-2.5 text-sm hover:bg-finomik-light2 transition">Cancel·lar</button>
                    </div>
                  )}

                  <div className="flex flex-col divide-y divide-finomik-light2">
                    {lecciones.length === 0 && addingLeccionTo !== modulo && (
                      <p className="px-5 py-3 text-xs text-finomik-mid3 italic">Encara no hi ha lliçons.</p>
                    )}

                    {lecciones.map(leccion => {
                      const leccionKey = `${modulo}__${leccion}`
                      const leccionCollapsed = collapsedLecciones[leccionKey] ?? false
                      const subtemas = tree[modulo]?.[leccion] ?? []

                      return (
                        <div key={leccion}>
                          <div className="bg-finomik-light2/40 px-5 py-2.5 flex items-center justify-between group/lec">
                            <button
                              onClick={() => setCollapsedLecciones(prev => ({ ...prev, [leccionKey]: !leccionCollapsed }))}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              <span className="text-finomik-mid3 text-xs w-3">{leccionCollapsed ? '▶' : '▼'}</span>
                              <h4 className="font-extrabold text-finomik-mid2 text-xs uppercase tracking-wide">{leccion}</h4>
                              <span className="text-finomik-mid3 text-xs ml-1">({subtemas.length})</span>
                            </button>
                            <div className="flex items-center gap-3">
                              {!leccionCollapsed && (
                                <button
                                  onClick={() => { setAddingSubtemaTo({ modulo, leccion }); setFSubtema(''); setFP1(''); setFP2(''); setFP3(''); setFormError(''); setAddingLeccionTo(null) }}
                                  className="text-finomik-blue text-xs font-extrabold hover:text-finomik-mid1 transition shrink-0"
                                >
                                  + Nou subtema
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteLeccion(modulo, leccion)}
                                className="text-red-400 hover:text-red-600 text-xs font-bold transition opacity-0 group-hover/lec:opacity-100 shrink-0"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {!leccionCollapsed && (
                            <>
                              {addingSubtemaTo?.modulo === modulo && addingSubtemaTo?.leccion === leccion && (
                                <div className="px-5 py-4 bg-finomik-light2/10 border-b border-finomik-light2 flex flex-col gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">Nom del subtema *</label>
                                    <input autoFocus value={fSubtema} onChange={e => setFSubtema(e.target.value)} placeholder="Ex: 1.1.1 Què són els diners i per a què serveixen" className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 bg-white" />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {[{ label: 'Pregunta 1', value: fP1, set: setFP1 }, { label: 'Pregunta 2', value: fP2, set: setFP2 }, { label: 'Pregunta 3', value: fP3, set: setFP3 }].map(({ label, value, set }) => (
                                      <div key={label} className="flex flex-col gap-1">
                                        <label className="text-xs font-extrabold text-finomik-mid3 uppercase tracking-wide">{label}</label>
                                        <input value={value} onChange={e => set(e.target.value)} placeholder="Què aprendrà l'alumne?" className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 bg-white" />
                                      </div>
                                    ))}
                                  </div>
                                  {formError && <p className="text-red-500 text-xs">{formError}</p>}
                                  <div className="flex gap-3 justify-end">
                                    <button onClick={() => { setAddingSubtemaTo(null); setFormError('') }} className="border border-finomik-light2 text-finomik-mid3 rounded-xl py-2 px-4 text-sm hover:bg-finomik-light2 transition">Cancel·lar</button>
                                    <button onClick={handleSaveSubtema} disabled={submitting || !fSubtema.trim()} className="bg-finomik-blue text-white rounded-xl py-2 px-5 font-extrabold text-sm hover:bg-finomik-mid1 transition disabled:opacity-40">{submitting ? 'Desant...' : 'Desar subtema'}</button>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-col">
                                {subtemas.length === 0 && addingSubtemaTo?.leccion !== leccion && (
                                  <p className="px-5 py-3 text-xs text-finomik-mid3 italic">Encara no hi ha subtemes.</p>
                                )}
                                {subtemas.map(item => {
                                  const tieneContenido = subtemaHasAnyContent(item.modulo, item.leccion, item.subtema)
                                  const tieneRetos = subtemaHasAnyRetos(item.modulo, item.leccion, item.subtema)
                                  const isExpanded = expandedSubtemas[item.id] ?? false
                                  const preguntas = [
                                    item.pregunta_1 ? { numero: 1, texto: item.pregunta_1 } : null,
                                    item.pregunta_2 ? { numero: 2, texto: item.pregunta_2 } : null,
                                    item.pregunta_3 ? { numero: 3, texto: item.pregunta_3 } : null,
                                  ].filter(Boolean) as { numero: number; texto: string }[]

                                  return (
                                    <div key={item.id} className="border-t border-finomik-light2/60 group/sub">
                                      <div className="flex items-center justify-between px-5 py-3 hover:bg-finomik-light2/20 transition">
                                        <button
                                          onClick={() => setExpandedSubtemas(prev => ({ ...prev, [item.id]: !isExpanded }))}
                                          className="flex items-center gap-3 text-left flex-1 min-w-0"
                                        >
                                          <span className="text-finomik-mid3 text-xs w-3 shrink-0">{isExpanded ? '▼' : '▶'}</span>
                                          <span className="text-sm font-medium text-finomik-blue truncate">{item.subtema}</span>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {tieneRetos && <span className="bg-finomik-gold/20 text-finomik-blue text-xs font-bold px-2 py-0.5 rounded-full">Reptes ✓</span>}
                                            {tieneContenido && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Contingut ✓</span>}
                                            {!tieneContenido && !tieneRetos && <span className="bg-finomik-light2 text-finomik-mid3 text-xs font-bold px-2 py-0.5 rounded-full">Pendent</span>}
                                          </div>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSubtema(item.id)}
                                          className="text-finomik-light3 hover:text-red-500 transition opacity-0 group-hover/sub:opacity-100 text-xs font-bold shrink-0 ml-3"
                                        >
                                          Eliminar
                                        </button>
                                      </div>

                                      {isExpanded && (
                                        <div className="bg-finomik-light2/5">
                                          {preguntas.length === 0 && (
                                            <p className="px-8 py-3 text-xs text-finomik-mid3 italic">Aquest subtema no té preguntes definides.</p>
                                          )}
                                          {preguntas.map(p => (
                                            <QuestionRow
                                              key={p.numero}
                                              modulo={item.modulo}
                                              leccion={item.leccion}
                                              subtema={item.subtema}
                                              pregunta_numero={p.numero}
                                              pregunta_texto={p.texto}
                                              hasContent={hasContenido(item.modulo, item.leccion, item.subtema, p.numero)}
                                              hasRetos={hasRetos(item.modulo, item.leccion, item.subtema, p.numero)}
                                              onSelect={() => onSelectSubtema({
                                                modulo: item.modulo,
                                                leccion: item.leccion,
                                                subtema: item.subtema,
                                                pregunta_numero: p.numero,
                                                pregunta_texto: p.texto,
                                              })}
                                              onRefresh={fetchAll}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
