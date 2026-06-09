'use client'

import { useState, useEffect } from 'react'

interface SubtemaItem {
  id: string
  modulo: string
  leccion: string
  subtema: string
  pregunta_1: string
  pregunta_2: string
  pregunta_3: string
}

interface SelectedQuestion {
  modulo: string
  leccion: string
  subtema: string
  pregunta_numero: number
  pregunta_texto: string
}

interface Props {
  onSelect: (item: SelectedQuestion) => void
  label?: string
}

const selectClass =
  'border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 bg-white w-full'

export default function SubtemaSelector({ onSelect, label }: Props) {
  const [items, setItems] = useState<SubtemaItem[]>([])
  const [selectedModulo, setSelectedModulo] = useState('')
  const [selectedLeccion, setSelectedLeccion] = useState('')
  const [selectedSubtema, setSelectedSubtema] = useState('')
  const [selectedPregunta, setSelectedPregunta] = useState('')

  useEffect(() => {
    fetch('/api/indice').then(r => r.ok ? r.json() : { data: [] }).then(d => setItems(d.data ?? []))
  }, [])

  const modulos = Array.from(new Set(items.map(i => i.modulo)))
  const lecciones = Array.from(new Set(items.filter(i => i.modulo === selectedModulo).map(i => i.leccion)))
  const subtemas = items.filter(i => i.modulo === selectedModulo && i.leccion === selectedLeccion)
  const activeSubtema = subtemas.find(s => s.subtema === selectedSubtema)

  const preguntas: { numero: number; texto: string }[] = []
  if (activeSubtema) {
    if (activeSubtema.pregunta_1) preguntas.push({ numero: 1, texto: activeSubtema.pregunta_1 })
    if (activeSubtema.pregunta_2) preguntas.push({ numero: 2, texto: activeSubtema.pregunta_2 })
    if (activeSubtema.pregunta_3) preguntas.push({ numero: 3, texto: activeSubtema.pregunta_3 })
  }

  function handleModuloChange(m: string) {
    setSelectedModulo(m)
    setSelectedLeccion('')
    setSelectedSubtema('')
    setSelectedPregunta('')
  }

  function handleLeccionChange(l: string) {
    setSelectedLeccion(l)
    setSelectedSubtema('')
    setSelectedPregunta('')
  }

  function handleSubtemaChange(s: string) {
    setSelectedSubtema(s)
    setSelectedPregunta('')
  }

  function handlePreguntaChange(val: string) {
    setSelectedPregunta(val)
    if (!activeSubtema || !val) return
    const num = Number(val)
    const p = preguntas.find(p => p.numero === num)
    if (!p) return
    onSelect({
      modulo: activeSubtema.modulo,
      leccion: activeSubtema.leccion,
      subtema: activeSubtema.subtema,
      pregunta_numero: p.numero,
      pregunta_texto: p.texto,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <span className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">{label}</span>
      )}
      <div className="flex flex-col gap-2">
        <select value={selectedModulo} onChange={e => handleModuloChange(e.target.value)} className={selectClass}>
          <option value="">-- Selecciona mòdul --</option>
          {modulos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {selectedModulo && (
          <select value={selectedLeccion} onChange={e => handleLeccionChange(e.target.value)} className={selectClass}>
            <option value="">-- Selecciona lliçó --</option>
            {lecciones.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
        {selectedLeccion && (
          <select value={selectedSubtema} onChange={e => handleSubtemaChange(e.target.value)} className={selectClass}>
            <option value="">-- Selecciona subtema --</option>
            {subtemas.map(s => <option key={s.id} value={s.subtema}>{s.subtema}</option>)}
          </select>
        )}
        {selectedSubtema && preguntas.length > 0 && (
          <select value={selectedPregunta} onChange={e => handlePreguntaChange(e.target.value)} className={selectClass}>
            <option value="">-- Selecciona pregunta --</option>
            {preguntas.map(p => (
              <option key={p.numero} value={String(p.numero)}>
                Pregunta {p.numero}: {p.texto}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
