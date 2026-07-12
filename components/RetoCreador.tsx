'use client'

import { useState } from 'react'
import { RETO_TEMPLATES, RetoTemplate } from '@/lib/retoTemplates'

interface Props {
  modulo: string
  leccion: string
  subtema: string
  onGuardado: () => void
  onCancel?: () => void
}

const ICONS = ['🎯', '💰', '📋', '⚡', '🌪️', '⏳', '✅', '✏️', '🔗', '🔢', '⏱️', '🔮', '📖']

export default function RetoCreador({ modulo, leccion, subtema, onGuardado, onCancel }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<RetoTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function handleSelectTemplate(t: RetoTemplate) {
    setSelectedTemplate(t)
    setFormData({})
    setError('')
  }

  function handleBack() {
    setSelectedTemplate(null)
    setFormData({})
    setError('')
  }

  async function handleGuardar() {
    if (!selectedTemplate) return
    setGuardando(true)
    setError('')

    const res = await fetch('/api/retos/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modulo,
        leccion,
        subtema,
        tipo_reto: selectedTemplate.nombre,
        datos: formData,
        aprobado: true,
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Error en desar')
      setGuardando(false)
      return
    }

    setGuardando(false)
    setSelectedTemplate(null)
    setFormData({})
    onGuardado()
  }

  // Template grid
  if (!selectedTemplate) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-finomik-blue text-base">Tria el tipus de repte</h3>
          {onCancel && (
            <button onClick={onCancel} className="text-xs text-finomik-mid3 hover:text-finomik-blue transition font-medium">
              Cancel·lar
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {RETO_TEMPLATES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t)}
              className="border border-finomik-light2 rounded-2xl p-4 cursor-pointer hover:border-finomik-blue hover:bg-finomik-blue/5 transition text-left flex flex-col gap-1.5"
            >
              <span className="text-2xl">{ICONS[i] ?? '🎮'}</span>
              <span className="font-extrabold text-finomik-blue text-xs leading-snug">{t.nombre}</span>
              <span className="text-finomik-mid3 text-xs leading-snug">{t.descripcion}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Form for selected template
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-finomik-mid3 hover:text-finomik-blue transition text-sm font-medium"
        >
          ← Tornar
        </button>
        <h3 className="font-black text-finomik-blue text-base">{selectedTemplate.nombre}</h3>
      </div>
      <p className="text-sm text-finomik-mid3">{selectedTemplate.descripcion}</p>

      <div className="flex flex-col gap-4">
        {selectedTemplate.fields.map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">
              {field.label}
            </label>
            {field.type === 'textarea' && (
              <textarea
                value={formData[field.key] ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={3}
                className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 resize-none"
              />
            )}
            {field.type === 'text' && (
              <input
                type="text"
                value={formData[field.key] ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20"
              />
            )}
            {field.type === 'select' && field.options && (
              <select
                value={formData[field.key] ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 bg-white"
              >
                <option value="">-- Seleccionar --</option>
                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <button
          onClick={handleBack}
          className="border border-finomik-light2 text-finomik-mid3 rounded-xl px-5 py-2.5 text-sm hover:bg-finomik-light2 transition"
        >
          Cancel·lar
        </button>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="bg-finomik-blue text-white rounded-xl px-6 py-2.5 font-extrabold text-sm hover:bg-finomik-mid1 transition disabled:opacity-40"
        >
          {guardando ? 'Desant...' : 'Desar repte'}
        </button>
      </div>
    </div>
  )
}
