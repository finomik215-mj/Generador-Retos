'use client'

import { useEffect, useState } from 'react'
import type { GuiaConexiones, AdaptacionBloque } from '@/lib/systemPromptConexiones'

function rowToGuia(row: Record<string, unknown>): GuiaConexiones {
  return {
    modulo: row.modulo as string,
    intro: (row.intro as string) ?? '',
    bloques: (row.bloques as AdaptacionBloque[]) ?? [],
  }
}

function guiaToText(g: GuiaConexiones): string {
  let out = `GUÍA DE ADAPTACIÓN CURRICULAR — ${g.modulo}\n\n${g.intro}\n`
  g.bloques.forEach((b, i) => {
    out += `\n${i + 1}. ${b.bloque}\n`
    out += `   Unidades conectadas: ${b.unidadesConectadas}\n`
    out += `   Cuándo introducirlo: ${b.momentoCurso}\n`
    out += `   Qué refuerza: ${b.refuerza}\n`
    out += `   Cómo integrarlo: ${b.comoIntegrar}\n`
    out += `   Competencias: ${b.competencias}\n`
  })
  return out
}

export default function ConexionesPanel({ modulo }: { modulo: string }) {
  const [guia, setGuia] = useState<GuiaConexiones | null>(null)
  const [estado, setEstado] = useState<string | null>(null)
  const [obert, setObert] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiat, setCopiat] = useState(false)

  useEffect(() => {
    setGuia(null); setEstado(null); setError('')
    fetch(`/api/conexiones/obtener?modulo=${encodeURIComponent(modulo)}`)
      .then(r => r.json())
      .then(({ data }) => { if (data) { setGuia(rowToGuia(data)); setEstado(data.estado) } })
      .catch(() => {})
  }, [modulo])

  async function generar() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/conexiones/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo }),
      })
      const data = await res.json()
      if (!res.ok) { setError((data.error ?? 'Error generant la guia') + (data.detail ? ` — ${data.detail}` : '')); return }
      setGuia(data as GuiaConexiones); setEstado('sense desar'); setObert(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function desar(nouEstat: 'propuesto' | 'aprobado') {
    if (!guia) return
    setSaving(true); setError('')
    const res = await fetch('/api/conexiones/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guia, estado: nouEstat }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? 'Error desant')
    else setEstado(nouEstat)
    setSaving(false)
  }

  function copiar() {
    if (!guia) return
    navigator.clipboard?.writeText(guiaToText(guia))
    setCopiat(true)
    setTimeout(() => setCopiat(false), 1500)
  }

  return (
    <div className="bg-finomik-gold/10 border border-finomik-gold/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="font-black text-finomik-blue">Adaptació al currículo oficial</h3>
        {estado && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            estado === 'aprobado' ? 'bg-green-100 text-green-800'
            : estado === 'sense desar' ? 'bg-slate-100 text-slate-500'
            : 'bg-amber-100 text-amber-800'
          }`}>Guia: {estado}</span>
        )}
      </div>
      <p className="text-xs text-finomik-mid3 mb-3">
        Instruccions per al professorat: com integrar cada bloc de Finomik amb les unitats del currículo oficial d&apos;Economia 1r de Batxillerat.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={generar}
          disabled={loading}
          className="bg-finomik-blue text-white font-extrabold text-sm px-5 py-2 rounded-xl hover:bg-finomik-blue/90 transition disabled:opacity-40"
        >
          {loading ? 'Generant…' : guia ? 'Regenerar guia' : 'Generar guia d’adaptació'}
        </button>
        {guia && (
          <>
            <button onClick={() => setObert(o => !o)} className="text-[12px] font-extrabold text-finomik-blue hover:underline">
              {obert ? 'Amagar' : 'Veure guia'}
            </button>
            <button onClick={copiar} className="text-[12px] font-extrabold text-finomik-blue hover:underline">
              {copiat ? 'Copiada!' : 'Copiar guia'}
            </button>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {guia && obert && (
        <div className="mt-4 flex flex-col gap-3">
          {guia.intro && <p className="text-sm text-finomik-mid3 italic">{guia.intro}</p>}
          {guia.bloques.map((b, i) => (
            <div key={b.bloque} className="border border-finomik-light2 rounded-xl p-4 bg-white">
              <p className="font-black text-finomik-blue text-sm mb-2">
                <span className="opacity-60">{i + 1}. </span>{b.bloque}
              </p>
              <dl className="grid grid-cols-1 gap-1.5 text-sm">
                <div><dt className="font-extrabold text-finomik-mid3 inline">Unitats connectades: </dt><dd className="inline">{b.unidadesConectadas}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Quan introduir-lo: </dt><dd className="inline">{b.momentoCurso}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Què reforça: </dt><dd className="inline">{b.refuerza}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Com integrar-lo: </dt><dd className="inline">{b.comoIntegrar}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Competències: </dt><dd className="inline">{b.competencias}</dd></div>
              </dl>
            </div>
          ))}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => desar('propuesto')} disabled={saving}
              className="border border-finomik-blue text-finomik-blue font-extrabold text-sm px-4 py-2 rounded-xl hover:bg-finomik-blue/5 transition disabled:opacity-40">
              {saving ? 'Desant…' : 'Desar esborrany'}
            </button>
            <button onClick={() => desar('aprobado')} disabled={saving}
              className="bg-finomik-gold text-finomik-blue font-extrabold text-sm px-4 py-2 rounded-xl hover:bg-finomik-gold/80 transition disabled:opacity-40">
              Aprovar guia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
