'use client'

import { useEffect, useState } from 'react'
import type { Ficha } from '@/lib/systemPromptFicha'
import type { Repte } from '@/lib/systemPromptReptes'

const IDIOMES: { id: string; label: string }[] = [
  { id: 'ca', label: 'Català' },
  { id: 'es', label: 'Castellà' },
  { id: 'en', label: 'Anglès' },
]

function rowToFicha(row: Record<string, unknown>): Ficha {
  return {
    modulo: row.modulo as string,
    orden: row.orden as number,
    idioma: (row.idioma as string) ?? 'ca',
    objetivo: (row.objetivo as string) ?? '',
    partida: (row.partida as string) ?? '',
    colisionOAncla: (row.colision_o_ancla as string) ?? '',
    recursoCentral: (row.recurso_central as string) ?? '',
    ordenExplicacion: (row.orden_explicacion as string[]) ?? [],
    incluidos: (row.incluidos as string[]) ?? [],
    excluidos: (row.excluidos as string[]) ?? [],
    evidenciaLogro: (row.evidencia_logro as string) ?? '',
  }
}

export default function FitxaPanel({ modulo, orden, bloque, subtema, onSaved }: {
  modulo: string; orden: number; bloque: string; subtema: string; onSaved?: () => void
}) {
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [estado, setEstado] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Contingut
  const [idiomaC, setIdiomaC] = useState('ca')
  const [contingut, setContingut] = useState('')
  const [loadingC, setLoadingC] = useState(false)
  const [savingC, setSavingC] = useState(false)
  const [contingutDesat, setContingutDesat] = useState(false)

  // Reptes
  const [reptes, setReptes] = useState<Repte[]>([])
  const [loadingR, setLoadingR] = useState(false)
  const [savingR, setSavingR] = useState(false)
  const [reptesDesat, setReptesDesat] = useState(false)

  const fichaDesada = estado === 'propuesto' || estado === 'aprobado'

  useEffect(() => {
    let viu = true
    fetch(`/api/ficha/obtener?modulo=${encodeURIComponent(modulo)}&orden=${orden}`)
      .then(r => r.json())
      .then(({ data }) => { if (viu && data) { setFicha(rowToFicha(data)); setEstado(data.estado) } })
      .catch(() => {})
    return () => { viu = false }
  }, [modulo, orden])

  async function generarFicha() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/ficha/generar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo, orden }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error generant la fitxa'); return }
      setFicha(data as Ficha); setEstado('sense desar')
    } catch (e) { setError(String(e)) } finally { setLoading(false) }
  }

  async function desarFicha(nouEstat: 'propuesto' | 'aprobado') {
    if (!ficha) return
    setSaving(true); setError('')
    const res = await fetch('/api/ficha/guardar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficha, estado: nouEstat }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? 'Error desant'); else { setEstado(nouEstat); onSaved?.() }
    setSaving(false)
  }

  async function generarContingut() {
    setLoadingC(true); setContingut(''); setContingutDesat(false); setError('')
    try {
      const res = await fetch('/api/contenido/desfitxa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo, orden, idioma: idiomaC }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error generant el contingut'); return }
      const reader = res.body!.getReader(); const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setContingut(prev => prev + dec.decode(value, { stream: true }))
      }
    } catch (e) { setError(String(e)) } finally { setLoadingC(false) }
  }

  async function desarContingut() {
    if (!contingut.trim()) return
    setSavingC(true)
    const res = await fetch('/api/contenido/aprobar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modulo, leccion: bloque, subtema, contenido: contingut, idioma: idiomaC }),
    })
    if (res.ok) { setContingutDesat(true); onSaved?.() }
    setSavingC(false)
  }

  async function generarReptes() {
    setLoadingR(true); setReptes([]); setReptesDesat(false); setError('')
    try {
      const res = await fetch('/api/reptes/desfitxa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo, orden, idioma: idiomaC }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error generant els reptes'); return }
      setReptes(data.reptes ?? [])
    } catch (e) { setError(String(e)) } finally { setLoadingR(false) }
  }

  async function desarReptes() {
    if (!reptes.length) return
    setSavingR(true)
    const res = await fetch('/api/retos/guardar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modulo, leccion: bloque, subtema, tipo_reto: 'Des de fitxa', datos: { reptes }, aprobado: false }),
    })
    if (res.ok) { setReptesDesat(true); onSaved?.() }
    setSavingR(false)
  }

  return (
    <div className="mt-3 border-t border-finomik-light2 pt-3">
      {/* ── Fitxa ── */}
      {!ficha && (
        <button onClick={generarFicha} disabled={loading}
          className="bg-finomik-blue text-white font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-finomik-blue/90 transition disabled:opacity-40">
          {loading ? 'Dissenyant la fitxa…' : '1 · Generar fitxa'}
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {ficha && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-finomik-light2/60 text-finomik-mid3">Fitxa · {estado}</span>
            <button onClick={generarFicha} disabled={loading} className="text-[11px] font-extrabold text-finomik-blue hover:underline disabled:opacity-40">
              {loading ? 'Regenerant…' : 'Regenerar'}
            </button>
          </div>
          <Camp t="Partida" v={ficha.partida} />
          <Camp t="Col·lisió / ancoratge" v={ficha.colisionOAncla} />
          <Camp t="Recurs central" v={ficha.recursoCentral} />
          <div>
            <p className="font-extrabold text-finomik-mid3 text-xs">Ordre d'explicació</p>
            <ol className="list-decimal pl-5">{ficha.ordenExplicacion.map((p, i) => <li key={i}>{p}</li>)}</ol>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <p className="font-extrabold text-finomik-mid3 text-xs">Inclou</p>
              <ul className="list-disc pl-5">{ficha.incluidos.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
            <div>
              <p className="font-extrabold text-finomik-mid3 text-xs">Exclou</p>
              <ul className="list-disc pl-5">{ficha.excluidos.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          </div>
          <Camp t="Evidència de logro" v={ficha.evidenciaLogro} />
          <div className="flex gap-2 pt-1">
            <button onClick={() => desarFicha('propuesto')} disabled={saving}
              className="border border-finomik-blue text-finomik-blue font-extrabold text-xs px-3 py-1.5 rounded-xl hover:bg-finomik-blue/5 transition disabled:opacity-40">
              {saving ? 'Desant…' : 'Desar esborrany'}
            </button>
            <button onClick={() => desarFicha('aprobado')} disabled={saving}
              className="bg-finomik-gold text-finomik-blue font-extrabold text-xs px-3 py-1.5 rounded-xl hover:bg-finomik-gold/80 transition disabled:opacity-40">
              Aprovar fitxa
            </button>
          </div>
        </div>
      )}

      {/* ── Contingut (des de la fitxa) ── */}
      {ficha && (
        <div className="mt-4 border-t border-finomik-light2 pt-3">
          <p className="font-black text-finomik-blue text-sm mb-2">2 · Contingut</p>
          {!fichaDesada ? (
            <p className="text-xs text-finomik-mid3">Desa la fitxa abans de generar el contingut.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <select value={idiomaC} onChange={e => setIdiomaC(e.target.value)}
                  className="border border-finomik-light2 rounded-xl px-2 py-1 text-xs">
                  {IDIOMES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>
                <button onClick={generarContingut} disabled={loadingC}
                  className="bg-finomik-blue text-white font-extrabold text-xs px-4 py-1.5 rounded-xl hover:bg-finomik-blue/90 transition disabled:opacity-40">
                  {loadingC ? 'Generant…' : 'Generar contingut'}
                </button>
                {contingut && !loadingC && (
                  contingutDesat
                    ? <span className="text-[11px] font-extrabold text-green-700">Desat a l'índex</span>
                    : <button onClick={desarContingut} disabled={savingC}
                        className="bg-finomik-gold text-finomik-blue font-extrabold text-xs px-4 py-1.5 rounded-xl hover:bg-finomik-gold/80 transition disabled:opacity-40">
                        {savingC ? 'Desant…' : 'Desar contingut'}
                      </button>
                )}
              </div>
              {contingut && (
                <div className="bg-white border border-finomik-light2 rounded-xl p-3 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {contingut}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Reptes ── */}
      {ficha && (
        <div className="mt-4 border-t border-finomik-light2 pt-3">
          <p className="font-black text-finomik-blue text-sm mb-2">3 · Reptes</p>
          {!fichaDesada ? (
            <p className="text-xs text-finomik-mid3">Desa la fitxa i el contingut abans dels reptes.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <button onClick={generarReptes} disabled={loadingR}
                  className="bg-finomik-blue text-white font-extrabold text-xs px-4 py-1.5 rounded-xl hover:bg-finomik-blue/90 transition disabled:opacity-40">
                  {loadingR ? 'Generant…' : `Generar reptes (${idiomaC})`}
                </button>
                {reptes.length > 0 && !loadingR && (
                  reptesDesat
                    ? <span className="text-[11px] font-extrabold text-green-700">Desats a l'índex</span>
                    : <button onClick={desarReptes} disabled={savingR}
                        className="bg-finomik-gold text-finomik-blue font-extrabold text-xs px-4 py-1.5 rounded-xl hover:bg-finomik-gold/80 transition disabled:opacity-40">
                        {savingR ? 'Desant…' : 'Desar reptes'}
                      </button>
                )}
              </div>
              {reptes.map((r, i) => (
                <div key={i} className="bg-white border border-finomik-light2 rounded-xl p-3 mb-2 text-sm">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-finomik-light2/60 text-finomik-mid3">{r.tipus}</span>
                  <p className="font-extrabold mt-1">{r.enunciat}</p>
                  {r.solucio && <p className="mt-1"><span className="text-finomik-mid3 text-xs font-extrabold">Solució: </span>{r.solucio}</p>}
                  {r.criterisAvaluacio && r.criterisAvaluacio.length > 0 && (
                    <div className="mt-1">
                      <p className="text-finomik-mid3 text-xs font-extrabold">Criteris d'avaluació</p>
                      <ul className="list-disc pl-5">{r.criterisAvaluacio.map((c, j) => <li key={j}>{c}</li>)}</ul>
                    </div>
                  )}
                  <p className="mt-1 text-xs"><span className="font-extrabold text-green-700">Encert: </span>{r.feedbackEncert}</p>
                  <p className="text-xs"><span className="font-extrabold text-amber-700">Error: </span>{r.feedbackError}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Camp({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <p className="font-extrabold text-finomik-mid3 text-xs">{t}</p>
      <p>{v}</p>
    </div>
  )
}
