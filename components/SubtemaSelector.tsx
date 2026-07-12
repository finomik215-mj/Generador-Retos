'use client'

import { useState, useEffect } from 'react'

interface Modul { id: string; nom: string; ordre: number }
interface Leccio { id: string; modulo: string; nom: string; ordre: number }
interface Subtema { id: string; modulo: string; leccion: string; nom: string; ordre: number }

interface SelectedSubtema {
  modulo: string
  leccion: string
  subtema: string
  pes: 'lleuger' | 'normal' | 'intens'
}

interface Props {
  onSelect: (item: SelectedSubtema) => void
  label?: string
}

const selectClass =
  'border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 bg-white w-full'

export default function SubtemaSelector({ onSelect, label }: Props) {
  const [moduls, setModuls] = useState<Modul[]>([])
  const [leccions, setLeccions] = useState<Leccio[]>([])
  const [subtemes, setSubtemes] = useState<Subtema[]>([])

  const [selectedModulo, setSelectedModulo] = useState('')
  const [selectedLeccion, setSelectedLeccion] = useState('')
  const [selectedSubtema, setSelectedSubtema] = useState('')

  useEffect(() => {
    fetch('/api/indice')
      .then(r => r.ok ? r.json() : { moduls: [], leccions: [], subtemes: [] })
      .then((d: { moduls: Modul[]; leccions: Leccio[]; subtemes: Subtema[] }) => {
        setModuls(d.moduls ?? [])
        setLeccions(d.leccions ?? [])
        setSubtemes(d.subtemes ?? [])
      })
  }, [])

  const filteredLeccions = leccions.filter(l => l.modulo === selectedModulo)
  const filteredSubtemes = subtemes.filter(s => s.modulo === selectedModulo && s.leccion === selectedLeccion)

  function handleModuloChange(m: string) {
    setSelectedModulo(m); setSelectedLeccion(''); setSelectedSubtema('')
  }
  function handleLeccionChange(l: string) {
    setSelectedLeccion(l); setSelectedSubtema('')
  }
  function derivarPes(blocNom: string, totalBlocs: number, blocIndex: number): 'lleuger' | 'normal' | 'intens' {
    const nom = blocNom.toLowerCase()
    if (blocIndex === 0) return 'lleuger'
    if (blocIndex >= totalBlocs - 1) return 'normal'
    if (/eina|product|invers|nòmina|impost|contrac|mercat|simulad/.test(nom)) return 'intens'
    if (/hàbit|consolidar|reflexi|construir|aprendr/.test(nom)) return 'lleuger'
    return 'normal'
  }

  function handleSubtemaChange(nom: string) {
    setSelectedSubtema(nom)
    if (nom) {
      const totalBlocs = filteredLeccions.length
      const blocIndex = filteredLeccions.findIndex(l => l.nom === selectedLeccion)
      const pes = derivarPes(selectedLeccion, totalBlocs, blocIndex)
      onSelect({ modulo: selectedModulo, leccion: selectedLeccion, subtema: nom, pes })
    }
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
            <option value="">-- Selecciona bloc --</option>
            {filteredLeccions.map(l => <option key={l.id} value={l.nom}>{l.nom}</option>)}
          </select>
        )}
        {selectedLeccion && (
          <select value={selectedSubtema} onChange={e => handleSubtemaChange(e.target.value)} className={selectClass}>
            <option value="">-- Selecciona subtema --</option>
            {filteredSubtemes.map(s => <option key={s.id} value={s.nom}>{s.nom}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}
