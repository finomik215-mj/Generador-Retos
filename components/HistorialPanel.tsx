'use client'

import { useState } from 'react'
import type { ContenidoAprobado } from '@/lib/supabase'

interface HistorialPanelProps {
  historial: ContenidoAprobado[]
  onDelete: (id: string) => void
}

export default function HistorialPanel({ historial, onDelete }: HistorialPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch('/api/contenido/historial', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    onDelete(id)
    setDeleting(null)
  }

  if (historial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="text-4xl">📂</div>
        <p className="font-extrabold text-finomik-blue">Encara no hi ha contingut desat</p>
        <p className="text-finomik-mid3 text-sm max-w-xs">
          Quan aproveu contingut generat, apareixerà aquí organitzat per mòdul.
        </p>
      </div>
    )
  }

  // Group by módulo
  const grouped: Record<string, ContenidoAprobado[]> = {}
  for (const item of historial) {
    if (!grouped[item.modulo]) grouped[item.modulo] = []
    grouped[item.modulo].push(item)
  }

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(grouped).map(([modulo, items]) => (
        <div key={modulo}>
          <p className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide mb-3">
            {modulo}
          </p>
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <div
                key={item.id}
                className="border border-finomik-light2 rounded-xl overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-finomik-light2/50 transition"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div>
                    <p className="text-sm font-extrabold text-finomik-blue">{item.subtema}</p>
                    <p className="text-xs text-finomik-mid3">{item.leccion} · {item.palabras ?? '?'} paraules</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                      disabled={deleting === item.id}
                      className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-40"
                    >
                      {deleting === item.id ? '...' : 'Eliminar'}
                    </button>
                    <span className="text-finomik-mid3 text-xs">
                      {expanded === item.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                {expanded === item.id && (
                  <div className="px-4 pb-4 border-t border-finomik-light2">
                    <p className="text-xs font-extrabold text-finomik-mid3 uppercase tracking-wide mt-3 mb-1">
                      Pregunta {item.pregunta_numero}
                    </p>
                    <p className="text-sm text-finomik-mid1 whitespace-pre-wrap mb-3">{item.pregunta_texto}</p>
                    <p className="text-xs font-extrabold text-finomik-mid3 uppercase tracking-wide mb-1">
                      Contingut
                    </p>
                    <p className="text-sm text-finomik-blue leading-relaxed whitespace-pre-wrap">{item.contenido}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
