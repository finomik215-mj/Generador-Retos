'use client'

import { useState, useEffect } from 'react'

interface Modul { id: string; nom: string; ordre: number }
interface Leccio { id: string; modulo: string; nom: string; ordre: number }
interface Subtema { id: string; modulo: string; leccion: string; nom: string; ordre: number }
interface Pregunta { id: string; modulo: string; leccion: string; subtema: string; text: string; ordre: number }

interface SelectedQuestion {
  modulo: string; leccion: string; subtema: string
  pregunta_numero: number; pregunta_texto: string
}

interface Props {
  onSelect: (item: SelectedQuestion) => void
  label?: string
}

const selectClass =
  'border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 bg-white w-full'

export default function SubtemaSelector({ onSelect, label }: Props) {
  const [moduls, setModuls] = useState<Modul[]>([])
  const [leccions, setLeccions] = useState<Leccio[]>([])
  const [subtemes, setSubtemes] = useState<Subtema[]>([])
  const [preguntes, setPreguntes] = useState<Pregunta[]>([])

  const [selectedModulo, setSelectedModulo] = useState('')
  const [selectedLeccion, setSelectedLeccion] = useState('')
  const [selectedSubtema, setSelectedSubtema] = useState('')
  const [selectedPregunta, setSelectedPregunta] = useState('')

  useEffect(() => {
    fetch('/api/indice')
      .then(r => r.ok ? r.json() : { moduls: [], leccions: [], subtemes: [], preguntes: [] })
      .then((d: { moduls: Modul[]; leccions: Leccio[]; subtemes: Subtema[]; preguntes: Pregunta[] }) => {
        setModuls(d.moduls ?? [])
        setLeccions(d.leccions ?? [])
        setSubtemes(d.subtemes ?? [])
        setPreguntes(d.preguntes ?? [])
      })
  }, [])

  const filteredLeccions = leccions.filter(l => l.modulo === selectedModulo)
  const filteredSubtemes = subtemes.filter(s => s.modulo === selectedModulo && s.leccion === selectedLeccion)
  const filteredPreguntes = preguntes.filter(p => p.modulo === selectedModulo && p.leccion === selectedLeccion && p.subtema === selectedSubtema)

  function handleModuloChange(m: string) {
    setSelectedModulo(m); setSelectedLeccion(''); setSelectedSubtema(''); setSelectedPregunta('')
  }
  function handleLeccionChange(l: string) {
    setSelectedLeccion(l); setSelectedSubtema(''); setSelectedPregunta('')
  }
  function handleSubtemaChange(s: string) {
    setSelectedSubtema(s); setSelectedPregunta('')
  }
  function handlePreguntaChange(id: string) {
    setSelectedPregunta(id)
    const p = filteredPreguntes.find(p => p.id === id)
    if (!p) return
    onSelect({
      modulo: p.modulo, leccion: p.leccion, subtema: p.subtema,
      pregunta_numero: p.ordre, pregunta_texto: p.text,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {label && <span className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">{label}</span>}
      <div className="flex flex-col gap-2">
        <select value={selectedModulo} onChange={e => handleModuloChange(e.target.value)} className={selectClass}>
          <option value="">-- Selecciona mòdul --</option>
          {moduls.map(m => <option key={m.id} value={m.nom}>{m.nom}</option>)}
        </select>
        {selectedModulo && (
          <select value={selectedLeccion} onChange={e => handleLeccionChange(e.target.value)} className={selectClass}>
            <option value="">-- Selecciona lliçó --</option>
            {filteredLeccions.map(l => <option key={l.id} value={l.nom}>{l.nom}</option>)}
          </select>
        )}
        {selectedLeccion && (
          <select value={selectedSubtema} onChange={e => handleSubtemaChange(e.target.value)} className={selectClass}>
            <option value="">-- Selecciona subtema --</option>
            {filteredSubtemes.map(s => <option key={s.id} value={s.nom}>{s.nom}</option>)}
          </select>
        )}
        {selectedSubtema && filteredPreguntes.length > 0 && (
          <select value={selectedPregunta} onChange={e => handlePreguntaChange(e.target.value)} className={selectClass}>
            <option value="">-- Selecciona pregunta --</option>
            {filteredPreguntes.map(p => (
              <option key={p.id} value={p.id}>Pregunta {p.ordre}: {p.text}</option>
            ))}
          </select>
        )}
        {selectedSubtema && filteredPreguntes.length === 0 && (
          <p className="text-xs text-finomik-mid3 italic px-1">Aquest subtema no té preguntes.</p>
        )}
      </div>
    </div>
  )
}
